describe('AppModule', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // AppModule decides at import time whether to register radar, so it is loaded fresh for each environment.
  function registeredControllers(env: Record<string, string | undefined>): string[] {
    process.env = { ...originalEnv, ...env };
    let controllers: { name: string }[] = [];
    jest.isolateModules(() => {
      // isolateModules needs a synchronous require to load a fresh copy.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { AppModule } = require('./app.module');
      controllers = Reflect.getMetadata('controllers', AppModule);
    });
    return controllers.map((controller) => controller.name);
  }

  it('does not register radar routes in production', () => {
    expect(registeredControllers({ NODE_ENV: 'production', RADAR_FEATURE_ENABLED: 'true' }))
      .toEqual(['HealthController', 'LocationsController', 'WeatherController']);
  });

  it('does not register radar routes unless enabled', () => {
    expect(registeredControllers({ NODE_ENV: 'development', RADAR_FEATURE_ENABLED: undefined })).not.toContain('RadarController');
  });

  it('registers radar routes when enabled outside production', () => {
    expect(registeredControllers({ NODE_ENV: 'development', RADAR_FEATURE_ENABLED: 'true' })).toContain('RadarController');
  });
});
