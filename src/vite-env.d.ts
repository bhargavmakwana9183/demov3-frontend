/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_UPSTOX_CLIENT_ID?: string;
  readonly VITE_UPSTOX_OAUTH_REDIRECT_URI?: string;
  readonly VITE_UPSTOX_OAUTH_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
