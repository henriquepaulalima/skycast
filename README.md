# Skycast

Skycast is a mobile-first weather app split into two independent packages:

- `client/`: Angular app with PrimeNG UI, Font Awesome icons, saved cities, and the weather screens.
- `server/`: NestJS API that normalizes Open-Meteo city and forecast data for the client.

The repository root is documentation-only. There is no root `package.json`; install and run each package from its own directory.

## Architecture

The Angular client requests browser location on first load. If permission is granted, it asks the server for a coordinate-based location and forecast. If permission is denied, the client displays a message and keeps city search available.

The NestJS API is the only layer that talks to Open-Meteo. It exposes normalized endpoints under `/api` so the client does not depend on Open-Meteo response fields.

## Weather Provider

Skycast uses Open-Meteo for this version. It was chosen over OpenWeather because it supports no-key non-commercial usage, 7+ day forecasts, city search, hourly and daily data, temperature, wind speed, humidity, weather codes, and precipitation probability.

OpenWeather also supports the required data, but it requires an API key and One Call subscription setup. Open-Meteo keeps local development and the first app version simpler.

## Setup

See the package-specific guides:

- [Client README](client/README.md)
- [Server README](server/README.md)
