import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CityLocation, WeatherForecast } from '../models/weather.models';
import { ApiService } from './api.service';
import { WeatherStateService } from './weather-state.service';

describe('WeatherStateService', () => {
  const city: CityLocation = {
    id: 1,
    name: 'Stuttgart',
    latitude: 48.7823,
    longitude: 9.177,
    timezone: 'Europe/Berlin'
  };
  const forecast: WeatherForecast = {
    location: city,
    current: {
      time: '2026-07-13T10:00',
      temperature: 20,
      windSpeed: 10,
      humidity: 60,
      rainProbability: 20,
      weatherCode: 3,
      description: 'Overcast'
    },
    today: [],
    tomorrow: [],
    week: []
  };

  it('stores the selected location and forecast', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ApiService,
          useValue: {
            getForecast: () => of(forecast)
          }
        }
      ]
    });
    const service = TestBed.inject(WeatherStateService);

    await service.selectLocation(city);

    expect(service.selectedLocation()).toEqual(city);
    expect(service.forecast()).toEqual(forecast);
    expect(service.error()).toBeNull();
  });

  it('sets an error when forecast loading fails', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ApiService,
          useValue: {
            getForecast: () => throwError(() => new Error('network'))
          }
        }
      ]
    });
    const service = TestBed.inject(WeatherStateService);

    await service.selectLocation(city);

    expect(service.forecast()).toBeNull();
    expect(service.error()).toBe('Unable to load weather for this location.');
  });
});
