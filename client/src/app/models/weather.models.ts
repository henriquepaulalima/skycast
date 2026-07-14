export interface CityLocation {
  id: number | string;
  name: string;
  country?: string;
  countryCode?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  windSpeed: number;
  humidity: number;
  rainProbability: number;
  weatherCode: number;
  description: string;
}

export interface HourWeather {
  time: string;
  hourLabel: string;
  temperature: number;
  weatherCode: number;
  description: string;
}

export interface DayWeather {
  date: string;
  dayLabel: string;
  minTemperature: number;
  maxTemperature: number;
  windSpeed: number;
  humidity: number;
  rainProbability: number;
  weatherCode: number;
  description: string;
}

export interface WeatherForecast {
  location: CityLocation;
  current: CurrentWeather;
  today: HourWeather[];
  tomorrow: HourWeather[];
  week: DayWeather[];
}

export interface RadarSnapshot {
  snapshot: number;
}
