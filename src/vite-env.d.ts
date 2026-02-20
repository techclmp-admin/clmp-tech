/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Build timestamp injected by the version-stamp plugin (production only) */
  readonly VITE_APP_VERSION: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
