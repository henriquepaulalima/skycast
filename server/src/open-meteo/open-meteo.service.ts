import { BadGatewayException, Injectable } from '@nestjs/common';
import { get } from 'node:https';
import { NominatimReverseResponse, OpenMeteoForecastResponse, OpenMeteoSearchResponse } from './open-meteo.types';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REVERSE_GEOCODING_URL = 'https://nominatim.openstreetmap.org/reverse';

@Injectable()
export class OpenMeteoService {
  public async searchLocations(query: string, limit: number): Promise<OpenMeteoSearchResponse> {
    const url = new URL(GEOCODING_URL);

    url.searchParams.set('name', query);
    url.searchParams.set('count', String(limit));
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');

    return this.fetchJson<OpenMeteoSearchResponse>(url);
  }

  public async getForecast(latitude: number, longitude: number, timezone: string): Promise<OpenMeteoForecastResponse> {
    const url = new URL(FORECAST_URL);

    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('timezone', timezone || 'auto');
    url.searchParams.set('forecast_days', '7');
    url.searchParams.set('current', [
      'temperature_2m',
      'relative_humidity_2m',
      'wind_speed_10m',
      'precipitation',
      'weather_code'
    ].join(','));
    url.searchParams.set('hourly', [
      'temperature_2m',
      'relative_humidity_2m',
      'wind_speed_10m',
      'precipitation_probability',
      'weather_code'
    ].join(','));
    url.searchParams.set('daily', [
      'temperature_2m_min',
      'temperature_2m_max',
      'wind_speed_10m_max',
      'precipitation_probability_max',
      'weather_code'
    ].join(','));

    return this.fetchJson<OpenMeteoForecastResponse>(url);
  }

  public async reverseLocation(latitude: number, longitude: number): Promise<NominatimReverseResponse> {
    const url = new URL(REVERSE_GEOCODING_URL);

    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('accept-language', 'en');
    url.searchParams.set('zoom', '10');

    return this.fetchJson<NominatimReverseResponse>(url);
  }

  private async fetchJson<T>(url: URL): Promise<T> {
    return new Promise((resolve, reject) => {
      const request = get(url, { family: 4, headers: { 'user-agent': 'skycast/0.1' } }, (response) => {
        let body = '';

        response.setEncoding('utf8');
        response.on('data', (chunk: string) => {
          body += chunk;
        });
        response.on('end', () => {
          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
            reject(new BadGatewayException(`Open-Meteo request failed with ${response.statusCode}`));
            return;
          }

          try {
            resolve(JSON.parse(body) as T);
          } catch {
            reject(new BadGatewayException('Open-Meteo returned invalid JSON'));
          }
        });
      });

      request.on('error', (error) => {
        reject(new BadGatewayException(`Open-Meteo request failed: ${error.message}`));
      });
      request.end();
    });
  }
}
