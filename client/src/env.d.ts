declare interface Env {
  readonly NG_APP_API_BASE_URL: string;
  [key: string]: string;
}

declare interface ImportMeta {
  readonly env: Env;
}

declare const _NGX_ENV_: Env;

declare namespace NodeJS {
  export type ProcessEnv = Env
}
