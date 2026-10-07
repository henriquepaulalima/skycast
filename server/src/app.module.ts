import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ClientIpThrottlerGuard } from './client-ip-throttler.guard';
import { HealthController } from './health.controller';
import { LocationsController } from './locations/locations.controller';
import { LocationsService } from './locations/locations.service';
import { RequestLoggerService } from './logger/request-logger.service';
import { OpenMeteoService } from './open-meteo/open-meteo.service';
import { RadarController } from './radar/radar.controller';
import { isRadarFeatureEnabled } from './radar/radar-feature';
import { RainbowRadarService } from './radar/rainbow-radar.service';
import { RainbowUsageService } from './radar/rainbow-usage.service';
import { WeatherController } from './weather/weather.controller';
import { WeatherService } from './weather/weather.service';

// Radar routes are only registered when the feature is enabled, so they are indistinguishable from unknown routes otherwise.
const radarEnabled = isRadarFeatureEnabled();

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }])],
  controllers: [HealthController, LocationsController, WeatherController, ...(radarEnabled ? [RadarController] : [])],
  providers: [
    LocationsService,
    OpenMeteoService,
    WeatherService,
    RequestLoggerService,
    ...(radarEnabled ? [RainbowRadarService, RainbowUsageService] : []),
    { provide: APP_GUARD, useClass: ClientIpThrottlerGuard }
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerService).forRoutes('*');
  }
}
