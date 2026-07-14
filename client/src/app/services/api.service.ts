import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CityLocation, RadarSnapshot, WeatherForecast } from '../models/weather.models';

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiBaseUrl = import.meta.env.NG_APP_API_BASE_URL || DEFAULT_API_BASE_URL;

  constructor(private readonly http: HttpClient) {}

  public searchCities(query: string, limit = 5): Observable<CityLocation[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('limit', limit);

    return this.http.get<CityLocation[]>(`${this.apiBaseUrl}/locations/search`, { params });
  }

  public reverseLocation(latitude: number, longitude: number): Observable<CityLocation> {
    const params = new HttpParams()
      .set('lat', latitude)
      .set('lon', longitude);

    return this.http.get<CityLocation>(`${this.apiBaseUrl}/locations/reverse`, { params });
  }

  public getForecast(location: CityLocation): Observable<WeatherForecast> {
    const params = new HttpParams()
      .set('lat', location.latitude)
      .set('lon', location.longitude)
      .set('timezone', location.timezone || 'auto')
      .set('name', location.name);

    return this.http.get<WeatherForecast>(`${this.apiBaseUrl}/weather/forecast`, { params });
  }

  public getRadarSnapshot(): Observable<RadarSnapshot> {
    const params = new HttpParams().set('layer', 'precip');

    return this.http.get<RadarSnapshot>(`${this.apiBaseUrl}/radar/snapshot`, { params });
  }

  public radarTileUrl(snapshot: number, forecastTime: number): string {
    return `${this.apiBaseUrl}/radar/tiles/precip/${snapshot}/${forecastTime}/{z}/{x}/{y}`;
  }
}
