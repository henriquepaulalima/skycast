import { BadGatewayException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { get } from 'node:https';
import { TtlCache } from '../cache/ttl-cache';
import { NominatimReverseResponse, OpenMeteoForecastResponse, OpenMeteoSearchResponse } from './open-meteo.types';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REVERSE_GEOCODING_URL = 'https://nominatim.openstreetmap.org/reverse';
// Nominatim's usage policy requires an application User-Agent that identifies the site using it.
const USER_AGENT = 'skycast/0.1 (+https://skycast-client.vercel.app)';
const REQUEST_TIMEOUT_MS = 8_000;
const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
// Nominatim allows at most one request per second; callers beyond this queue length are refused.
const NOMINATIM_INTERVAL_MS = 1_000;
const MAX_NOMINATIM_QUEUE = 10;

@Injectable()
export class OpenMeteoService {
  private readonly forecastCache = new TtlCache<OpenMeteoForecastResponse>(10 * MINUTE_MS, 2_000);
  private readonly searchCache = new TtlCache<OpenMeteoSearchResponse>(DAY_MS, 2_000);
  private readonly reverseCache = new TtlCache<NominatimReverseResponse>(DAY_MS, 2_000);
  private nominatimQueue: Promise<void> = Promise.resolve();
  private pendingNominatimRequests = 0;

  public async searchLocations(query: string, limit: number): Promise<OpenMeteoSearchResponse> {
    const url = new URL(GEOCODING_URL);

    url.searchParams.set('name', query);
    url.searchParams.set('count', String(limit));
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');

    return this.searchCache.get(`${query.toLocaleLowerCase()}|${limit}`, () => this.fetchJson<OpenMeteoSearchResponse>(url));
  }

  public async getForecast(latitude: number, longitude: number, timezone: string): Promise<OpenMeteoForecastResponse> {
    const url = new URL(FORECAST_URL);
    // About 1 km of precision: finer than the forecast grid, and lets nearby requests share one cache entry.
    const roundedLatitude = latitude.toFixed(2);
    const roundedLongitude = longitude.toFixed(2);

    url.searchParams.set('latitude', roundedLatitude);
    url.searchParams.set('longitude', roundedLongitude);
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

    return this.forecastCache.get(
      `${roundedLatitude},${roundedLongitude}|${timezone || 'auto'}`,
      () => this.fetchJson<OpenMeteoForecastResponse>(url)
    );
  }

  public async reverseLocation(latitude: number, longitude: number): Promise<NominatimReverseResponse> {
    const url = new URL(REVERSE_GEOCODING_URL);
    const roundedLatitude = latitude.toFixed(2);
    const roundedLongitude = longitude.toFixed(2);

    url.searchParams.set('lat', roundedLatitude);
    url.searchParams.set('lon', roundedLongitude);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('accept-language', 'en');
    url.searchParams.set('zoom', '10');

    return this.reverseCache.get(
      `${roundedLatitude},${roundedLongitude}`,
      () => this.scheduleNominatim(() => this.fetchJson<NominatimReverseResponse>(url))
    );
  }

  private scheduleNominatim<T>(request: () => Promise<T>): Promise<T> {
    if (this.pendingNominatimRequests >= MAX_NOMINATIM_QUEUE) {
      return Promise.reject(new ServiceUnavailableException('Reverse geocoding is busy. Try again shortly.'));
    }

    this.pendingNominatimRequests += 1;

    const result = this.nominatimQueue.then(request);

    this.nominatimQueue = result
      .then(() => undefined, () => undefined)
      .then(() => new Promise((resolve) => setTimeout(resolve, NOMINATIM_INTERVAL_MS)));

    return result.finally(() => {
      this.pendingNominatimRequests -= 1;
    });
  }

  private async fetchJson<T>(url: URL): Promise<T> {
    return new Promise((resolve, reject) => {
      const request = get(url, { family: 4, headers: { 'user-agent': USER_AGENT } }, (response) => {
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

      request.setTimeout(REQUEST_TIMEOUT_MS, () => {
        request.destroy(new Error('timed out'));
      });
      request.on('error', (error) => {
        reject(new BadGatewayException(`Open-Meteo request failed: ${error.message}`));
      });
      request.end();
    });
  }
}
