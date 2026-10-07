import { TestBed } from '@angular/core/testing';
import { faBolt, faCloud, faCloudBolt, faCloudRain, faCloudShowersHeavy, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { AppSettingsService } from './app-settings.service';
import { WeatherIconService } from './weather-icon.service';

describe('WeatherIconService', () => {
  let service: WeatherIconService;

  beforeEach(() => {
    localStorage.clear();
    service = TestBed.inject(WeatherIconService);
  });

  it('maps weather codes to icons', () => {
    expect(service.getWeatherIcon(0)).toBe(faSun);
    expect(service.getWeatherIcon(2)).toBe(faCloud);
    expect(service.getWeatherIcon(45)).toBe(faCloud);
    expect(service.getWeatherIcon(61)).toBe(faCloudRain);
    expect(service.getWeatherIcon(95)).toBe(faCloudBolt);
    expect(service.getWeatherIcon(73)).toBe(faCloudShowersHeavy);
    expect(service.getWeatherIcon(1234)).toBe(faBolt);
  });

  it('shows a moon for clear skies between 18:00 and 06:00', () => {
    expect(service.getWeatherIcon(0, '2026-10-07T18:00')).toBe(faMoon);
    expect(service.getWeatherIcon(0, '2026-10-07T05:00')).toBe(faMoon);
    expect(service.getWeatherIcon(0, '2026-10-07T06:00')).toBe(faSun);
    expect(service.getWeatherIcon(0, 'not a time')).toBe(faSun);
  });

  it('colors icons by weather and theme', () => {
    expect(service.getWeatherIconColor(0)).toBe('#e29e21');
    expect(service.getWeatherIconColor(0, '2026-10-07T22:00')).toBe('#6c839c');
    expect(service.getWeatherIconColor(63)).toBe('#516880');
    expect(service.getWeatherIconColor(3)).toBe('#d6f4ff');

    TestBed.inject(AppSettingsService).setTheme('light');
    expect(service.getWeatherIconColor(3)).toBe('#bed6f1');
  });
});
