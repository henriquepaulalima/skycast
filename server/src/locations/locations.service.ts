import { BadRequestException, Injectable } from '@nestjs/common';
import { CityLocation } from '../models/weather.models';
import { OpenMeteoService } from '../open-meteo/open-meteo.service';
import { OpenMeteoSearchResult } from '../open-meteo/open-meteo.types';

@Injectable()
export class LocationsService {
  constructor(private readonly openMeteoService: OpenMeteoService) {}

  public async search(query: string, limit: number): Promise<CityLocation[]> {
    if (query.trim().length < 2) {
      return [];
    }

    const response = await this.openMeteoService.searchLocations(query.trim(), Math.min(Math.max(limit, 1), 10));

    return (response.results ?? []).map((location) => this.mapLocation(location));
  }

  public async reverse(latitude: number, longitude: number): Promise<CityLocation> {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new BadRequestException('lat and lon must be valid coordinates');
    }

    const response = await this.openMeteoService.reverseLocation(latitude, longitude);
    const cityName = response.address?.city
      || response.address?.town
      || response.address?.village
      || response.address?.municipality
      || response.address?.county;

    if (cityName) {
      return {
        id: `coords:${latitude.toFixed(4)},${longitude.toFixed(4)}`,
        name: cityName,
        country: response.address?.country,
        countryCode: response.address?.country_code?.toUpperCase(),
        admin1: response.address?.state,
        latitude,
        longitude,
        timezone: 'auto'
      };
    }

    return {
      id: `coords:${latitude.toFixed(4)},${longitude.toFixed(4)}`,
      name: 'Current location',
      latitude,
      longitude,
      timezone: 'auto'
    };
  }

  private mapLocation(location: OpenMeteoSearchResult): CityLocation {
    return {
      id: location.id,
      name: location.name,
      country: location.country,
      countryCode: location.country_code,
      admin1: location.admin1,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone
    };
  }
}
