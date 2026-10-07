import { TestBed } from '@angular/core/testing';
import { CityLocation } from '../models/weather.models';
import { SavedCitiesService } from './saved-cities.service';

describe('SavedCitiesService', () => {
  const city: CityLocation = {
    id: 1,
    name: 'Stuttgart',
    country: 'Germany',
    latitude: 48.7823,
    longitude: 9.177,
    timezone: 'Europe/Berlin'
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('saves and removes cities from localStorage', () => {
    const service = TestBed.inject(SavedCitiesService);

    service.save(city);

    expect(service.savedCities()).toEqual([city]);
    expect(service.isSaved(city)).toBeTrue();

    service.remove(city);

    expect(service.savedCities()).toEqual([]);
    expect(service.isSaved(city)).toBeFalse();
  });

  it('does not duplicate a saved city', () => {
    const service = TestBed.inject(SavedCitiesService);

    service.save(city);
    service.save(city);

    expect(service.savedCities()).toEqual([city]);
  });

  it('clears all saved cities', () => {
    const service = TestBed.inject(SavedCitiesService);
    service.save({ id: 9, name: 'Lisbon', latitude: 38.7, longitude: -9.1, timezone: 'Europe/Lisbon' });

    service.clear();

    expect(service.savedCities()).toEqual([]);
    expect(localStorage.getItem('skycast.savedCities')).toBe('[]');
  });

  it('recovers from corrupted storage', () => {
    localStorage.setItem('skycast.savedCities', '{broken');

    const service = TestBed.inject(SavedCitiesService);

    expect(service.savedCities()).toEqual([]);
    expect(localStorage.getItem('skycast.savedCities')).toBeNull();
  });
});

