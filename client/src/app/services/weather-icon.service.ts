import { Injectable, inject } from '@angular/core';
import {
  IconDefinition,
  faBookmark,
  faBolt,
  faCloud,
  faCloudBolt,
  faCloudRain,
  faCloudShowersHeavy,
  faDownload,
  faDroplet,
  faGear,
  faLocationDot,
  faMagnifyingGlass,
  faMoon,
  faPlus,
  faSun,
  faTemperatureHalf,
  faTrash,
  faWind
} from '@fortawesome/free-solid-svg-icons';
import { AppSettingsService } from './app-settings.service';

@Injectable({
  providedIn: 'root'
})
export class WeatherIconService {
  private readonly appSettings = inject(AppSettingsService);

  public readonly uiIcons = {
    location: faLocationDot,
    search: faMagnifyingGlass,
    saved: faBookmark,
    save: faPlus,
    remove: faTrash,
    config: faGear,
    install: faDownload,
    temperature: faTemperatureHalf,
    wind: faWind,
    humidity: faDroplet,
    rain: faCloudRain
  };

  public getWeatherIcon(weatherCode: number, time?: string): IconDefinition {
    if (weatherCode === 0 && this.isAfterSixPm(time)) {
      return faMoon;
    }

    if (weatherCode === 0) {
      return faSun;
    }

    if ([1, 2, 3, 45, 48].includes(weatherCode)) {
      return faCloud;
    }

    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) {
      return faCloudRain;
    }

    if ([95, 96, 99].includes(weatherCode)) {
      return faCloudBolt;
    }

    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
      return faCloudShowersHeavy;
    }

    return faBolt;
  }

  public getWeatherIconColor(weatherCode: number, time?: string): string {
    if (weatherCode === 0 && this.isAfterSixPm(time)) {
      return '#6c839c';
    }

    if (weatherCode === 0) {
      return '#e29e21';
    }

    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(weatherCode)) {
      return '#516880';
    }

    return this.appSettings.theme() === 'light' ? '#bed6f1' : '#d6f4ff';
  }

  private isAfterSixPm(time?: string): boolean {
    if (!time) {
      return false;
    }

    const hour = Number(time.slice(11, 13));

    return Number.isFinite(hour) && (hour >= 18 || hour < 6);
  }
}
