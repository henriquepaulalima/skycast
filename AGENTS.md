# Repository Guidelines

## Project Structure & Module Organization
`client/` contains the Angular 18 application. Core bootstrapping lives in `client/src/main.ts`, app routing lives under `client/src/app/`, and UI screens are in `client/src/app/pages/`. Shared client services belong in `client/src/app/services/`. `server/` contains the NestJS API and Open-Meteo integration. The repository root is documentation-only; do not add a root `package.json`.

## Build, Test, and Development Commands
Run commands from the package directory.

- `cd client && npm start`: runs the Angular dev server at `http://localhost:4200/`.
- `cd client && npm run build`: creates the client production build.
- `cd server && npm run start:dev`: runs the NestJS API at `http://localhost:3000/api`.
- `cd server && npm run build`: compiles the API into `server/dist`.
- `npm run lint` and `npm test`: run inside either `client/` or `server/`.

## Coding Style & Naming Conventions
Use TypeScript, standalone Angular components, NestJS services/controllers, and SCSS for styles. Follow the existing code style: 2-space indentation and single quotes. Keep Angular selectors as `app-...` in kebab-case and service files named by responsibility, such as `weather-state.service.ts`.

## Testing Guidelines
The client uses Jasmine/Karma through `ng test`. The server uses Jest. Place tests next to the code they cover using `*.spec.ts` filenames. Cover client state services, saved-city behavior, permission-denied behavior, and server Open-Meteo normalization.

## Commit & Pull Request Guidelines
Recent commits use short imperative subjects like `setup env variables` and `Create header componet, setup fonts and location service`. Keep commit messages concise, focused on one change, and written in the imperative. PRs should include a brief summary, linked issue when applicable, test/lint status, and screenshots for UI changes.

## Security & Configuration Tips
Client environment values are injected through `import.meta.env` and typed in `client/src/env.d.ts`. Do not commit secrets. Open-Meteo currently needs no key for non-commercial use; document any future provider keys in the relevant package README.
