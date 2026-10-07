import { EventEmitter } from 'node:events';
import { get } from 'node:https';
import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';
import { OpenMeteoService } from './open-meteo.service';

jest.mock('node:https', () => ({
  get: jest.fn()
}));

interface MockRequest {
  end: jest.Mock;
  on: jest.Mock;
  setTimeout: jest.Mock;
  destroy: jest.Mock;
}

describe('OpenMeteoService', () => {
  const mockedGet = get as jest.Mock;

  beforeEach(() => {
    mockedGet.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function respondWith(body: unknown, statusCode = 200): void {
    mockedGet.mockImplementation((_url: URL, _options: unknown, callback: (response: unknown) => void) => {
      const response = Object.assign(new EventEmitter(), { statusCode, setEncoding: jest.fn() });
      process.nextTick(() => {
        callback(response);
        response.emit('data', typeof body === 'string' ? body : JSON.stringify(body));
        response.emit('end');
      });
      return createRequest();
    });
  }

  function createRequest(): MockRequest {
    const request: MockRequest = {
      end: jest.fn(),
      on: jest.fn(),
      setTimeout: jest.fn(),
      destroy: jest.fn()
    };
    return request;
  }

  const requestedUrl = (call = 0): URL => mockedGet.mock.calls[call][0] as URL;

  it('requests a 7-day forecast with coordinates rounded to two decimals', async () => {
    respondWith({ timezone: 'America/Sao_Paulo' });
    const service = new OpenMeteoService();

    await service.getForecast(-22.906847, -43.172897, 'America/Sao_Paulo');
    const url = requestedUrl();

    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(url.searchParams.get('latitude')).toBe('-22.91');
    expect(url.searchParams.get('longitude')).toBe('-43.17');
    expect(url.searchParams.get('timezone')).toBe('America/Sao_Paulo');
    expect(url.searchParams.get('forecast_days')).toBe('7');
    expect(url.searchParams.get('hourly')).toContain('precipitation_probability');
  });

  it('serves nearby forecast requests from the cache', async () => {
    respondWith({ timezone: 'auto' });
    const service = new OpenMeteoService();

    await service.getForecast(-22.9068, -43.1729, 'auto');
    await service.getForecast(-22.9071, -43.1731, 'auto');
    await service.getForecast(-22.95, -43.1729, 'auto');
    await service.getForecast(-22.9068, -43.1729, 'Europe/Berlin');

    expect(mockedGet).toHaveBeenCalledTimes(3);
  });

  it('caches city searches case-insensitively per limit', async () => {
    respondWith({ results: [] });
    const service = new OpenMeteoService();

    await service.searchLocations('Rio', 5);
    await service.searchLocations('rio', 5);
    await service.searchLocations('rio', 10);

    expect(mockedGet).toHaveBeenCalledTimes(2);
    expect(requestedUrl().searchParams.get('name')).toBe('Rio');
    expect(requestedUrl().searchParams.get('count')).toBe('5');
  });

  it('identifies the application to Nominatim', async () => {
    respondWith({ address: {} });
    const service = new OpenMeteoService();

    await service.reverseLocation(-22.9068, -43.1729);

    const [url, options] = mockedGet.mock.calls[0] as [URL, { headers: Record<string, string> }];
    expect(url.hostname).toBe('nominatim.openstreetmap.org');
    expect(url.searchParams.get('lat')).toBe('-22.91');
    expect(options.headers['user-agent']).toMatch(/^skycast\/\S+ \(\+https:\/\/skycast-client\.vercel\.app\)$/);
  });

  it('sends Nominatim at most one request per second', async () => {
    jest.useFakeTimers();
    respondWith({ address: {} });
    const service = new OpenMeteoService();

    const first = service.reverseLocation(1, 1);
    const second = service.reverseLocation(2, 2);
    await jest.advanceTimersByTimeAsync(10);
    expect(mockedGet).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1_000);
    await Promise.all([first, second]);
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });

  it('refuses reverse geocoding when ten requests are already waiting', async () => {
    mockedGet.mockImplementation(() => createRequest());
    const service = new OpenMeteoService();

    for (let i = 0; i < 10; i++) {
      void service.reverseLocation(i, i).catch(() => undefined);
    }

    await expect(service.reverseLocation(50, 50)).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('maps upstream errors, invalid JSON and network failures to 502', async () => {
    const service = new OpenMeteoService();

    respondWith({ error: true }, 500);
    await expect(service.searchLocations('error', 1)).rejects.toBeInstanceOf(BadGatewayException);

    respondWith('<html>');
    await expect(service.searchLocations('invalid', 1)).rejects.toBeInstanceOf(BadGatewayException);

    mockedGet.mockImplementation(() => {
      const request = createRequest();
      request.on.mockImplementation((event: string, listener: (error: Error) => void) => {
        if (event === 'error') process.nextTick(() => listener(new Error('ECONNRESET')));
      });
      return request;
    });
    await expect(service.searchLocations('network', 1)).rejects.toThrow('Open-Meteo request failed: ECONNRESET');
  });

  it('does not cache failed requests', async () => {
    const service = new OpenMeteoService();

    respondWith({}, 503);
    await expect(service.searchLocations('retry', 1)).rejects.toBeInstanceOf(BadGatewayException);
    respondWith({ results: [] });
    await expect(service.searchLocations('retry', 1)).resolves.toEqual({ results: [] });
  });

  it('times out upstream requests after 8 seconds', async () => {
    let request: MockRequest | undefined;
    mockedGet.mockImplementation(() => {
      request = createRequest();
      return request;
    });
    const service = new OpenMeteoService();

    void service.searchLocations('slow', 1).catch(() => undefined);
    const [timeout, onTimeout] = request!.setTimeout.mock.calls[0] as [number, () => void];
    onTimeout();

    expect(timeout).toBe(8_000);
    expect(request!.destroy).toHaveBeenCalledWith(new Error('timed out'));
  });
});
