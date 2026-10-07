import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiBaseUrl } from '../../services/api.service';

export interface RadarSnapshot {
  snapshot: number;
}

// Lives next to the radar map so the production bundle carries no radar code while the map is not rendered.
@Injectable({
  providedIn: 'root'
})
export class RadarApiService {
  private readonly http = inject(HttpClient);

  public getRadarSnapshot(): Observable<RadarSnapshot> {
    const params = new HttpParams().set('layer', 'precip');

    return this.http.get<RadarSnapshot>(`${apiBaseUrl()}/radar/snapshot`, { params });
  }

  public radarTileUrl(snapshot: number, forecastTime: number): string {
    return `${apiBaseUrl()}/radar/tiles/precip/${snapshot}/${forecastTime}/{z}/{x}/{y}`;
  }
}
