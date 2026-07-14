import { isRadarFeatureEnabled } from './radar-feature';

describe('isRadarFeatureEnabled', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalRadarFeatureEnabled = process.env.RADAR_FEATURE_ENABLED;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.RADAR_FEATURE_ENABLED = originalRadarFeatureEnabled;
  });

  it('disables the radar feature by default', () => {
    delete process.env.NODE_ENV;
    delete process.env.RADAR_FEATURE_ENABLED;

    expect(isRadarFeatureEnabled()).toBe(false);
  });

  it('enables the radar feature only when explicitly allowed outside production', () => {
    process.env.NODE_ENV = 'development';
    process.env.RADAR_FEATURE_ENABLED = 'true';

    expect(isRadarFeatureEnabled()).toBe(true);
  });

  it('keeps the radar feature disabled in production even if explicitly allowed', () => {
    process.env.NODE_ENV = 'production';
    process.env.RADAR_FEATURE_ENABLED = 'true';

    expect(isRadarFeatureEnabled()).toBe(false);
  });
});
