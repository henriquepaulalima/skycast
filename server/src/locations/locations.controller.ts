import { Controller, Get, Query } from '@nestjs/common';
import { CityLocation } from '../models/weather.models';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('search')
  public search(@Query('q') query = '', @Query('limit') limit = '10'): Promise<CityLocation[]> {
    return this.locationsService.search(query, Number(limit));
  }

  @Get('reverse')
  public reverse(@Query('lat') latitude: string, @Query('lon') longitude: string): Promise<CityLocation> {
    return this.locationsService.reverse(Number(latitude), Number(longitude));
  }
}
