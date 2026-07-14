import { Module } from '@nestjs/common';
import { LocationsController } from './locations/locations.controller';
import { LocationsService } from './locations/locations.service';
import { OpenMeteoService } from './open-meteo/open-meteo.service';
import { WeatherController } from './weather/weather.controller';
import { WeatherService } from './weather/weather.service';

@Module({
  controllers: [LocationsController, WeatherController],
  providers: [LocationsService, OpenMeteoService, WeatherService]
})
export class AppModule {}
