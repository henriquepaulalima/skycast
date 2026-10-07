import { WeatherService } from './weather.service';
import { OpenMeteoService } from '../open-meteo/open-meteo.service';
import { OpenMeteoForecastResponse } from '../open-meteo/open-meteo.types';

describe('WeatherService', () => {
  it('normalizes Open-Meteo forecast data for the client', async () => {
    const openMeteoService = {
      getForecast: jest.fn().mockResolvedValue(createForecastResponse())
    } as unknown as OpenMeteoService;
    const service = new WeatherService(openMeteoService);

    const forecast = await service.forecast(48.78, 9.18, 'Europe/Berlin', 'Stuttgart');

    expect(forecast.location.name).toBe('Stuttgart');
    expect(forecast.current.temperature).toBe(20);
    expect(forecast.today.length).toBeGreaterThan(0);
    expect(forecast.tomorrow.length).toBe(24);
    expect(forecast.week).toHaveLength(7);
    expect(forecast.week[0].humidity).toBe(60);
  });

  it('labels the first day Today and describes weather codes', async () => {
    const service = new WeatherService({ getForecast: jest.fn().mockResolvedValue(createForecastResponse()) } as unknown as OpenMeteoService);

    const forecast = await service.forecast(48.78, 9.18, 'auto', 'Stuttgart');

    expect(forecast.week[0].dayLabel).toBe('Today');
    expect(forecast.current.description).toBe('Overcast');
    expect(forecast.week[0].rainProbability).toBe(40);
  });

  it.each([
    [Number.NaN, 0],
    [0, Number.POSITIVE_INFINITY],
    [90.01, 0],
    [-90.01, 0],
    [0, 180.01],
    [0, -180.01]
  ])('rejects invalid coordinates %p, %p without calling Open-Meteo', async (latitude, longitude) => {
    const getForecast = jest.fn();
    const service = new WeatherService({ getForecast } as unknown as OpenMeteoService);

    await expect(service.forecast(latitude, longitude, 'auto', '')).rejects.toThrow('lat and lon must be valid coordinates');
    expect(getForecast).not.toHaveBeenCalled();
  });

  it('falls back to automatic time zones for unexpected values', async () => {
    const getForecast = jest.fn().mockResolvedValue(createForecastResponse());
    const service = new WeatherService({ getForecast } as unknown as OpenMeteoService);

    await service.forecast(1, 2, 'America/Sao_Paulo', 'A');
    await service.forecast(1, 2, 'Etc/GMT+3', 'A');
    await service.forecast(1, 2, '../../etc?x=1', 'A');
    await service.forecast(1, 2, 'a'.repeat(65), 'A');

    expect(getForecast.mock.calls.map((call) => call[2])).toEqual(['America/Sao_Paulo', 'Etc/GMT+3', 'auto', 'auto']);
  });

  it('limits location names to 100 characters and defaults empty names', async () => {
    const service = new WeatherService({ getForecast: jest.fn().mockResolvedValue(createForecastResponse()) } as unknown as OpenMeteoService);

    const long = await service.forecast(1, 2, 'auto', 'x'.repeat(500));
    const empty = await service.forecast(1, 2, 'auto', '');

    expect(long.location.name).toHaveLength(100);
    expect(empty.location.name).toBe('Current location');
  });
});

function createForecastResponse(): OpenMeteoForecastResponse {
  const days = ['2026-07-13', '2026-07-14', '2026-07-15', '2026-07-16', '2026-07-17', '2026-07-18', '2026-07-19'];
  const hours = days.flatMap((day) => Array.from({ length: 24 }, (_, hour) => `${day}T${String(hour).padStart(2, '0')}:00`));

  return {
    latitude: 48.78,
    longitude: 9.18,
    timezone: 'Europe/Berlin',
    current: {
      time: '2026-07-13T10:00',
      temperature_2m: 20,
      relative_humidity_2m: 60,
      wind_speed_10m: 12,
      precipitation_probability: 30,
      weather_code: 3
    },
    hourly: {
      time: hours,
      temperature_2m: hours.map(() => 20),
      relative_humidity_2m: hours.map(() => 60),
      wind_speed_10m: hours.map(() => 12),
      precipitation_probability: hours.map(() => 30),
      weather_code: hours.map(() => 3)
    },
    daily: {
      time: days,
      temperature_2m_min: days.map(() => 16),
      temperature_2m_max: days.map(() => 24),
      wind_speed_10m_max: days.map(() => 18),
      precipitation_probability_max: days.map(() => 40),
      weather_code: days.map(() => 3)
    }
  };
}
