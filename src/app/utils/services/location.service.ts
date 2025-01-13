import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  public apiEndpoint = 'https://maps.googleapis.com/maps/api/geocode/json';
  public apiKey!: string;

  constructor(
    private http: HttpClient
  ) {
    this.apiKey = import.meta.env.NG_APP_GOOGLE_MAPS_PLATFORMA_KEY;
  }

  public getCoords(): Promise<GeolocationCoordinates> {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(resp => {
        resolve(resp.coords);
      });
    });
  }

  public async getLocation(): Promise<Observable<ILocationData>> {
    return await this.getCoords()
      .then((coords) => {
        const apiUrl = `${this.apiEndpoint}?latlng=${coords.latitude},${coords.longitude}&result_type=locality&key=${this.apiKey}`;
        return apiUrl;
      })
      .then((apiUrl) => {
        return this.http.get<ILocationData>(apiUrl);
      });
  }
}

interface ILocationData {
  results: [
    {
      address_components: [
        {
          long_name: string
        }
      ],
      formatted_address: string,
    }
  ]
}
