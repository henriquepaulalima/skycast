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

  it('skips searches shorter than two characters', async () => {
    const searchLocations = jest.fn();
    const service = new LocationsService({ searchLocations } as unknown as OpenMeteoService);

    await expect(service.search(' r ', 5)).resolves.toEqual([]);
    expect(searchLocations).not.toHaveBeenCalled();
  });

  it('trims and shortens queries and clamps the result limit', async () => {
    const searchLocations = jest.fn().mockResolvedValue({});
    const service = new LocationsService({ searchLocations } as unknown as OpenMeteoService);

    await service.search(`  ${'a'.repeat(150)}  `, 50);
    await service.search('rio', 0);
    await service.search('rio', Number.NaN);

    expect(searchLocations).toHaveBeenNthCalledWith(1, 'a'.repeat(100), 10);
    expect(searchLocations).toHaveBeenNthCalledWith(2, 'rio', 1);
    expect(searchLocations).toHaveBeenNthCalledWith(3, 'rio', 10);
  });

  it('maps Open-Meteo search results to city locations', async () => {
    const service = new LocationsService({
      searchLocations: jest.fn().mockResolvedValue({
        results: [{ id: 1, name: 'Rio', country: 'Brazil', country_code: 'BR', admin1: 'RJ', latitude: -22.9, longitude: -43.2, timezone: 'America/Sao_Paulo' }]
      })
    } as unknown as OpenMeteoService);

    await expect(service.search('rio', 1)).resolves.toEqual([
      { id: 1, name: 'Rio', country: 'Brazil', countryCode: 'BR', admin1: 'RJ', latitude: -22.9, longitude: -43.2, timezone: 'America/Sao_Paulo' }
    ]);
  });

  it('rejects out-of-range coordinates for reverse lookups', async () => {
    const reverseLocation = jest.fn();
    const service = new LocationsService({ reverseLocation } as unknown as OpenMeteoService);

    await expect(service.reverse(91, 0)).rejects.toThrow('lat and lon must be valid coordinates');
    expect(reverseLocation).not.toHaveBeenCalled();
  });
});
