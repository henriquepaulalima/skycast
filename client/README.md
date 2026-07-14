# Skycast Client

Angular 18 weather UI for Skycast. The app uses PrimeNG for modals, tabs, buttons, and inputs, plus Font Awesome for UI and weather icons.

## Setup

```bash
npm install
npm start
```

The dev server runs at `http://localhost:4200/`. Start the NestJS API from `../server` before using city search or forecast loading.

## Commands

- `npm start`: run the Angular dev server.
- `npm run build`: create the production build in `dist/skycast`.
- `npm run watch`: rebuild continuously with the development configuration.
- `npm run lint`: lint TypeScript and Angular templates.
- `npm test`: run Karma/Jasmine unit tests.

## Configuration

The client reads `NG_APP_API_BASE_URL` through `@ngx-env/builder`. If unset, it defaults to `http://localhost:3000/api`.

Example local value:

```bash
NG_APP_API_BASE_URL=http://localhost:3000/api
```

## UI Structure

- Home requests browser location on first load.
- If location is denied, the app shows a message and opens city search.
- City selection uses a PrimeNG dialog with `Search` and `Saved` tabs.
- Saved cities are stored in `localStorage` under `skycast.savedCities`.
- Today and Tomorrow show hourly cards; Week navigates to `/week`.
- Weather data attribution: Open-Meteo.
