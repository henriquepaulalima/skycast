import { LocationsService } from './locations.service';
import { OpenMeteoService } from '../open-meteo/open-meteo.service';

describe('LocationsService', () => {
  it('uses the nearest geocoding result as the current location label', async () => {
    const openMeteoService = {
      reverseLocation: jest.fn().mockResolvedValue({
        address: {
          city: 'Rio de Janeiro',
          state: 'Rio de Janeiro',
          country: 'Brazil',
          country_code: 'br'
        }
      })
    } as unknown as OpenMeteoService;
    const service = new LocationsService(openMeteoService);

    const location = await service.reverse(-22.91, -43.2);

    expect(location.name).toBe('Rio de Janeiro');
    expect(location.admin1).toBe('Rio de Janeiro');
    expect(location.countryCode).toBe('BR');
  });

  it('uses town, village, or county when city is unavailable', async () => {
    const openMeteoService = {
      reverseLocation: jest.fn().mockResolvedValue({
        address: {
          town: 'Niteroi',
          country: 'Brazil'
        }
      })
    } as unknown as OpenMeteoService;
    const service = new LocationsService(openMeteoService);

    const location = await service.reverse(-22.88, -43.1);

    expect(location.name).toBe('Niteroi');
  });

  it('falls back to the generic label when no reverse location exists', async () => {
    const openMeteoService = {
      reverseLocation: jest.fn().mockResolvedValue({
        address: {
          country: 'Brazil'
          }
      })
    } as unknown as OpenMeteoService;
    const service = new LocationsService(openMeteoService);

    const location = await service.reverse(-22.91, -43.2);

    expect(location.name).toBe('Current location');
  });
});
