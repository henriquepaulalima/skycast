import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CityLocation, WeatherForecast } from '../models/weather.models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class WeatherStateService {
  public readonly selectedLocation = signal<CityLocation | null>(null);
  public readonly forecast = signal<WeatherForecast | null>(null);
  public readonly loading = signal(false);
  public readonly error = signal<string | null>(null);

  constructor(private readonly apiService: ApiService) {}

  public async selectLocation(location: CityLocation): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const forecast = await firstValueFrom(this.apiService.getForecast(location));

      this.selectedLocation.set(forecast.location);
      this.forecast.set(forecast);
    } catch {
      this.error.set('Unable to load weather for this location.');
    } finally {
      this.loading.set(false);
    }
  }
}
