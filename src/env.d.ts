declare interface Env {
  readonly NG_APP_GOOGLE_MAPS_PLATFORMA_KEY: string;
  [key: string]: string;
}

declare interface ImportMeta {
  readonly env: Env;
}

declare const _NGX_ENV_: Env;

declare namespace NodeJS {
  export type ProcessEnv = Env
}
