import { Controller, Get, Header, Query } from '@nestjs/common';
import { WeatherForecast } from '../models/weather.models';
import { WeatherService } from './weather.service';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('forecast')
  @Header('Cache-Control', 'public, max-age=300')
  public forecast(
    @Query('lat') latitude: string,
    @Query('lon') longitude: string,
    @Query('timezone') timezone = 'auto',
    @Query('name') name = 'Current location'
  ): Promise<WeatherForecast> {
    return this.weatherService.forecast(Number(latitude), Number(longitude), timezone, name);
  }
}
