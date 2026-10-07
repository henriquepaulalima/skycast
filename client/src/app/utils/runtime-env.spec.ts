import { isProductionEnv, readEnv } from './runtime-env';

describe('runtime env', () => {
  it('reads build-time variables and detects production', () => {
    const envName = readEnv('NG_APP_ENV') ?? readEnv('ENV');

    expect(isProductionEnv()).toBe(envName === 'prod' || envName === 'production');
  });

  it('returns undefined for variables that are not set', () => {
    expect(readEnv('NG_APP_DOES_NOT_EXIST' as Parameters<typeof readEnv>[0])).toBeUndefined();
  });
});
