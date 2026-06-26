const DEFAULT_API_BASE = "https://stockmaster.babydatingx.in/api/v1";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;

const apiOrigin = new URL(API_BASE_URL).origin;

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || apiOrigin;

const UPSTOX_CLIENT_ID =
  import.meta.env.VITE_UPSTOX_CLIENT_ID ||
  "f12aa6f2-c2f2-42d4-b57e-8bdbde050da1";

const upstoxRedirectUri =
  import.meta.env.VITE_UPSTOX_OAUTH_REDIRECT_URI ||
  `${apiOrigin}/api/v1/stock`;

export const UPSTOX_OAUTH_URL =
  import.meta.env.VITE_UPSTOX_OAUTH_URL ||
  `https://api-v2.upstox.com/login/authorization/dialog?client_id=${UPSTOX_CLIENT_ID}&redirect_uri=${encodeURIComponent(upstoxRedirectUri)}`;

export const AUTH_TOKEN_KEY = "authToken";
export const AUTH_USER_KEY = "authUser";
