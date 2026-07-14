import { Injectable, signal } from '@angular/core';
import { CityLocation } from '../models/weather.models';

const STORAGE_KEY = 'skycast.savedCities';

@Injectable({
  providedIn: 'root'
})
export class SavedCitiesService {
  public readonly savedCities = signal<CityLocation[]>(this.readSavedCities());

  public save(city: CityLocation): void {
    if (this.isSaved(city)) {
      return;
    }

    this.persist([...this.savedCities(), city]);
  }

  public remove(city: CityLocation): void {
    this.persist(this.savedCities().filter((savedCity) => savedCity.id !== city.id));
  }

  public clear(): void {
    this.persist([]);
  }

  public isSaved(city: CityLocation): boolean {
    return this.savedCities().some((savedCity) => savedCity.id === city.id);
  }

  private persist(cities: CityLocation[]): void {
    this.savedCities.set(cities);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cities));
  }

  private readSavedCities(): CityLocation[] {
    const rawCities = localStorage.getItem(STORAGE_KEY);

    if (!rawCities) {
      return [];
    }

    try {
      return JSON.parse(rawCities) as CityLocation[];
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }
}
