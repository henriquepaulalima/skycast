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
