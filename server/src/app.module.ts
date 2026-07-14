import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LocationsController } from './locations/locations.controller';
import { LocationsService } from './locations/locations.service';
import { RequestLoggerService } from './logger/request-logger.service';
import { OpenMeteoService } from './open-meteo/open-meteo.service';
import { RadarController } from './radar/radar.controller';
import { RainbowRadarService } from './radar/rainbow-radar.service';
import { RainbowUsageService } from './radar/rainbow-usage.service';
import { WeatherController } from './weather/weather.controller';
import { WeatherService } from './weather/weather.service';

@Module({
  controllers: [LocationsController, RadarController, WeatherController],
  providers: [LocationsService, OpenMeteoService, RainbowRadarService, RainbowUsageService, WeatherService, RequestLoggerService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerService).forRoutes('*');
  }
}
