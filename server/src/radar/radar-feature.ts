export function isRadarFeatureEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  return process.env.RADAR_FEATURE_ENABLED === 'true';
}
