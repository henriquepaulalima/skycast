type RuntimeEnv = Partial<Env> & {
  ENV?: string;
};

const runtimeEnv: RuntimeEnv = typeof _NGX_ENV_ !== 'undefined'
  ? _NGX_ENV_
  : (import.meta.env ?? {});

export function readEnv(key: keyof RuntimeEnv): string | undefined {
  return runtimeEnv[key];
}

export function isProductionEnv(): boolean {
  const envName = readEnv('NG_APP_ENV') ?? readEnv('ENV');

  return envName === 'prod' || envName === 'production';
}
