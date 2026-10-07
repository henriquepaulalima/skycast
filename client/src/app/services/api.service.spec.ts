import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RadarApiService } from '../pages/home/radar-api.service';
import { ApiService, apiBaseUrl } from './api.service';

describe('ApiService', () => {
  let api: ApiService;
  let http: HttpTestingController;
  const base = apiBaseUrl();

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('searches cities with a query and limit', () => {
    api.searchCities('Rio', 5).subscribe();

    const request = http.expectOne((req) => req.url === `${base}/locations/search`);
    expect(request.request.params.get('q')).toBe('Rio');
    expect(request.request.params.get('limit')).toBe('5');
    request.flush([]);
  });

  it('reverse geocodes coordinates', () => {
    api.reverseLocation(-22.9, -43.2).subscribe();

    const request = http.expectOne((req) => req.url === `${base}/locations/reverse`);
    expect(request.request.params.get('lat')).toBe('-22.9');
    expect(request.request.params.get('lon')).toBe('-43.2');
    request.flush({});
  });

  it('requests a forecast for a location, defaulting the time zone', () => {
    api.getForecast({ id: 1, name: 'Rio', latitude: -22.9, longitude: -43.2, timezone: '' }).subscribe();

    const request = http.expectOne((req) => req.url === `${base}/weather/forecast`);
    expect(request.request.params.get('timezone')).toBe('auto');
    expect(request.request.params.get('name')).toBe('Rio');
    request.flush({});
  });

  it('builds radar snapshot and tile URLs', () => {
    const radar = TestBed.inject(RadarApiService);

    radar.getRadarSnapshot().subscribe();
    const request = http.expectOne((req) => req.url === `${base}/radar/snapshot`);
    expect(request.request.params.get('layer')).toBe('precip');
    request.flush({ snapshot: 1 });

    expect(radar.radarTileUrl(1754991000, 600)).toBe(`${base}/radar/tiles/precip/1754991000/600/{z}/{x}/{y}`);
  });
});
