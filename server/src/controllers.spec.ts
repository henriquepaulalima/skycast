import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { LocationsController } from './locations/locations.controller';
import { LocationsService } from './locations/locations.service';
import { WeatherController } from './weather/weather.controller';
import { WeatherService } from './weather/weather.service';

describe('controllers', () => {
  const locationsService = { search: jest.fn().mockResolvedValue([]), reverse: jest.fn().mockResolvedValue({}) };
  const weatherService = { forecast: jest.fn().mockResolvedValue({}) };
  const header = (target: object, method: string) => Reflect.getMetadata('__headers__', (target as Record<string, object>)[method]);

  async function createControllers() {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController, LocationsController, WeatherController],
      providers: [
        { provide: LocationsService, useValue: locationsService },
        { provide: WeatherService, useValue: weatherService }
      ]
    }).compile();
    return {
      health: moduleRef.get(HealthController),
      locations: moduleRef.get(LocationsController),
      weather: moduleRef.get(WeatherController)
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses query parameters before calling the services', async () => {
    const { locations, weather } = await createControllers();

    await locations.search('rio', '3');
    await locations.search();
    await locations.reverse('-22.9', '-43.2');
    await weather.forecast('-22.9', '-43.2', 'America/Sao_Paulo', 'Rio');
    await weather.forecast('-22.9', '-43.2');

    expect(locationsService.search).toHaveBeenNthCalledWith(1, 'rio', 3);
    expect(locationsService.search).toHaveBeenNthCalledWith(2, '', 10);
    expect(locationsService.reverse).toHaveBeenCalledWith(-22.9, -43.2);
    expect(weatherService.forecast).toHaveBeenNthCalledWith(1, -22.9, -43.2, 'America/Sao_Paulo', 'Rio');
    expect(weatherService.forecast).toHaveBeenNthCalledWith(2, -22.9, -43.2, 'auto', 'Current location');
  });

  it('lets clients cache forecasts for 5 minutes and locations for an hour', () => {
    expect(header(WeatherController.prototype, 'forecast')).toEqual([{ name: 'Cache-Control', value: 'public, max-age=300' }]);
    expect(header(LocationsController.prototype, 'search')).toEqual([{ name: 'Cache-Control', value: 'public, max-age=3600' }]);
    expect(header(LocationsController.prototype, 'reverse')).toEqual([{ name: 'Cache-Control', value: 'public, max-age=3600' }]);
  });

  it('reports health without rate limiting', async () => {
    const { health } = await createControllers();

    expect(health.check()).toEqual({ status: 'ok' });
    expect(Reflect.getMetadata('THROTTLER:SKIPdefault', HealthController)).toBe(true);
  });
});
