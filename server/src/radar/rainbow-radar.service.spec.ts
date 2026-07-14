import { EventEmitter } from 'node:events';
import { get } from 'node:https';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { RainbowRadarService } from './rainbow-radar.service';
import { RainbowUsageService } from './rainbow-usage.service';

jest.mock('node:https', () => ({
  get: jest.fn()
}));

describe('RainbowRadarService', () => {
  const originalToken = process.env.RAINBOW_API_TOKEN;
  const originalLimit = process.env.RAINBOW_MONTHLY_TILE_LIMIT;
  const originalUsageFile = process.env.RAINBOW_USAGE_FILE;
  const testUsageFile = resolve(process.cwd(), '.data/rainbow-usage-test.json');
  const mockedGet = get as jest.Mock;

  beforeEach(() => {
    mockedGet.mockReset();
    process.env.RAINBOW_API_TOKEN = 'rainbow-token';
    process.env.RAINBOW_USAGE_FILE = testUsageFile;
    delete process.env.RAINBOW_MONTHLY_TILE_LIMIT;
    rmSync(testUsageFile, { force: true });
  });

  afterEach(() => {
    process.env.RAINBOW_API_TOKEN = originalToken;
    process.env.RAINBOW_MONTHLY_TILE_LIMIT = originalLimit;
    process.env.RAINBOW_USAGE_FILE = originalUsageFile;
    rmSync(testUsageFile, { force: true });
  });

  it('requires a Rainbow token for snapshot requests', async () => {
    delete process.env.RAINBOW_API_TOKEN;
    const service = createService();

    await expect(service.getSnapshot('precip')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('rejects unsupported snapshot layers', async () => {
    const service = createService();

    await expect(service.getSnapshot('temperature')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('caches snapshot responses for repeated layer requests', async () => {
    mockHttpsResponse(JSON.stringify({ snapshot: 1754991000 }));
    const service = createService();

    await expect(service.getSnapshot('precip')).resolves.toEqual({ snapshot: 1754991000 });
    await expect(service.getSnapshot('precip')).resolves.toEqual({ snapshot: 1754991000 });

    expect(mockedGet).toHaveBeenCalledTimes(1);
  });

  it('validates forecast time before requesting a precipitation tile', async () => {
    const service = createService();

    await expect(service.getPrecipitationTile('1754991000', '300', '8', '100', '100')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('streams Rainbow precipitation tiles as PNG buffers', async () => {
    const tile = Buffer.from('png-data');

    mockHttpsResponse(tile, 'image/png');
    const service = createService();

    await expect(service.getPrecipitationTile('1754991000', '0', '1', '0', '1')).resolves.toEqual({
      body: tile,
      contentType: 'image/png'
    });
  });

  it('blocks precipitation tiles after the configured usage limit is reached', async () => {
    process.env.RAINBOW_MONTHLY_TILE_LIMIT = '1';
    mockHttpsResponse(Buffer.from('png-data'), 'image/png');
    const service = createService();

    await service.getPrecipitationTile('1754991000', '0', '1', '0', '1');
    try {
      await service.getPrecipitationTile('1754991000', '0', '1', '0', '1');
      fail('Expected monthly usage limit to block the second tile request');
    } catch (error) {
      expect((error as { getStatus(): number }).getStatus()).toBe(429);
    }

    expect(mockedGet).toHaveBeenCalledTimes(1);
  });

  function createService(): RainbowRadarService {
    return new RainbowRadarService(new RainbowUsageService());
  }

  function mockHttpsResponse(body: string | Buffer, contentType = 'application/json'): void {
    mockedGet.mockImplementation((_url, _options, callback) => {
      const response = new EventEmitter() as EventEmitter & {
        headers: Record<string, string>;
        statusCode: number;
      };
      const request = {
        end: jest.fn(),
        on: jest.fn()
      };

      response.headers = { 'content-type': contentType };
      response.statusCode = 200;

      process.nextTick(() => {
        callback(response);
        response.emit('data', Buffer.isBuffer(body) ? body : Buffer.from(body));
        response.emit('end');
      });

      return request;
    });
  }
});
