import { BadRequestException, Injectable } from '@nestjs/common';
import { CityLocation, DayWeather, HourWeather, WeatherForecast } from '../models/weather.models';
import { OpenMeteoService } from '../open-meteo/open-meteo.service';
import { OpenMeteoForecastResponse } from '../open-meteo/open-meteo.types';

@Injectable()
export class WeatherService {
  constructor(private readonly openMeteoService: OpenMeteoService) {}

  public async forecast(latitude: number, longitude: number, timezone: string, name: string): Promise<WeatherForecast> {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new BadRequestException('lat and lon must be valid coordinates');
    }

    const response = await this.openMeteoService.getForecast(latitude, longitude, timezone);
    const location: CityLocation = {
      id: `coords:${latitude.toFixed(4)},${longitude.toFixed(4)}`,
      name: name || 'Current location',
      latitude,
      longitude,
      timezone: response.timezone
    };

    return this.mapForecast(location, response);
  }

  private mapForecast(location: CityLocation, response: OpenMeteoForecastResponse): WeatherForecast {
    const currentTime = new Date(response.current.time);
    const currentDayKey = response.current.time.slice(0, 10);
    const tomorrowKey = this.addDays(currentDayKey, 1);

    return {
      location,
      current: {
        time: response.current.time,
        temperature: response.current.temperature_2m,
        windSpeed: response.current.wind_speed_10m,
        humidity: response.current.relative_humidity_2m,
        rainProbability: this.nearestHourlyValue(response, response.current.time, 'precipitation_probability'),
        weatherCode: response.current.weather_code,
        description: this.describeWeather(response.current.weather_code)
      },
      today: this.mapHours(response, (time) => time.startsWith(currentDayKey) && new Date(time) >= currentTime),
      tomorrow: this.mapHours(response, (time) => time.startsWith(tomorrowKey)),
      week: this.mapDays(response)
    };
  }

  private mapHours(response: OpenMeteoForecastResponse, predicate: (time: string) => boolean): HourWeather[] {
    return response.hourly.time
      .map((time, index) => ({ time, index }))
      .filter(({ time }) => predicate(time))
      .map(({ time, index }) => ({
        time,
        hourLabel: new Intl.DateTimeFormat('en', { hour: 'numeric' }).format(new Date(time)),
        temperature: response.hourly.temperature_2m[index],
        weatherCode: response.hourly.weather_code[index],
        description: this.describeWeather(response.hourly.weather_code[index])
      }));
  }

  private mapDays(response: OpenMeteoForecastResponse): DayWeather[] {
    return response.daily.time.map((date, index) => ({
      date,
      dayLabel: index === 0 ? 'Today' : new Intl.DateTimeFormat('en', { weekday: 'long' }).format(new Date(`${date}T12:00:00`)),
      minTemperature: response.daily.temperature_2m_min[index],
      maxTemperature: response.daily.temperature_2m_max[index],
      windSpeed: response.daily.wind_speed_10m_max[index],
      humidity: this.averageHumidityForDay(response, date),
      rainProbability: response.daily.precipitation_probability_max[index],
      weatherCode: response.daily.weather_code[index],
      description: this.describeWeather(response.daily.weather_code[index])
    }));
  }

  private averageHumidityForDay(response: OpenMeteoForecastResponse, date: string): number {
    const values = response.hourly.time
      .map((time, index) => ({ time, humidity: response.hourly.relative_humidity_2m[index] }))
      .filter(({ time }) => time.startsWith(date))
      .map(({ humidity }) => humidity);

    if (values.length === 0) {
      return 0;
    }

    return values.reduce((total, value) => total + value, 0) / values.length;
  }

  private nearestHourlyValue(
    response: OpenMeteoForecastResponse,
    time: string,
    key: 'precipitation_probability'
  ): number {
    const index = response.hourly.time.findIndex((hourTime) => hourTime >= time);

    if (index === -1) {
      return 0;
    }

    return response.hourly[key][index] ?? 0;
  }

  private addDays(date: string, days: number): string {
    const parsedDate = new Date(`${date}T12:00:00`);

    parsedDate.setDate(parsedDate.getDate() + days);

    return parsedDate.toISOString().slice(0, 10);
  }

  private describeWeather(weatherCode: number): string {
    if (weatherCode === 0) {
      return 'Clear sky';
    }

    if ([1, 2].includes(weatherCode)) {
      return 'Partly cloudy';
    }

    if (weatherCode === 3) {
      return 'Overcast';
    }

    if ([45, 48].includes(weatherCode)) {
      return 'Fog';
    }

    if ([51, 53, 55, 56, 57].includes(weatherCode)) {
      return 'Drizzle';
    }

    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
      return 'Rain';
    }

    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
      return 'Snow';
    }

    if ([95, 96, 99].includes(weatherCode)) {
      return 'Thunderstorm';
    }

    return 'Cloudy';
  }
}
