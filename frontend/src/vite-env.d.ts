/// <reference types="vite/client" />

// Some TS setups in this repo may not pick up vite's ImportMeta typing.
// This ensures `import.meta.env` is recognized.

declare interface ImportMetaEnv {
  readonly VITE_API_URL?: string
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}

