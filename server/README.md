# Skycast Server

NestJS API for Skycast. It wraps Open-Meteo and returns normalized weather data for the Angular client.

## Setup

```bash
npm install
npm run start:dev
```

The API runs at `http://localhost:3000/api` by default.

## Commands

- `npm run start:dev`: run the API in watch mode.
- `npm run build`: compile the NestJS app into `dist`.
- `npm start`: run the compiled server from `dist/main.js`.
- `npm run lint`: lint server TypeScript files.
- `npm test`: run Jest unit tests.

## API

### `GET /api/locations/search?q={query}&limit=10`

Returns city matches:

```json
[
  {
    "id": 2825297,
    "name": "Stuttgart",
    "country": "Germany",
    "countryCode": "DE",
    "admin1": "Baden-Wurttemberg",
    "latitude": 48.78232,
    "longitude": 9.17702,
    "timezone": "Europe/Berlin"
  }
]
```

### `GET /api/locations/reverse?lat={lat}&lon={lon}`

Returns a coordinate-based fallback location. Open-Meteo does not provide a documented reverse-geocoding endpoint, so the app labels browser coordinates as `Current location`.

### `GET /api/weather/forecast?lat={lat}&lon={lon}&timezone={timezone}&name={name}`

Returns normalized `location`, `current`, `today`, `tomorrow`, and `week` data. Values use Celsius, km/h, and percentages.

### `GET /api/radar/snapshot?layer=precip`

Returns the latest Rainbow Weather tile snapshot timestamp. Requires `RAINBOW_API_TOKEN`.

### `GET /api/radar/tiles/precip/{snapshot}/{forecastTime}/{z}/{x}/{y}`

Proxies Rainbow Weather precipitation PNG tiles. `forecastTime` must be between `0` and `14400` seconds in `600` second steps.

### `GET /api/radar/usage`

Returns local monthly Rainbow tile usage tracked by the Skycast server.

## Open-Meteo Notes

Open-Meteo is used without an API key for non-commercial local development. It provides city search, current weather, hourly weather, daily weather, and 7-day forecasts. The free API is rate-limited, so avoid polling more often than needed.

## Rainbow Weather Notes

Live radar tiles require a server-side `RAINBOW_API_TOKEN`. Keep it out of the client environment so browser requests only hit the Skycast API proxy.

The proxy tracks tile usage in `server/.data/rainbow-usage.json` and blocks tile requests with `429` after `RAINBOW_MONTHLY_TILE_LIMIT` is reached. The default is `30000`, matching Rainbow's published free monthly tile tier. Set `RAINBOW_MONTHLY_TILE_LIMIT=0` to disable the local lock.
