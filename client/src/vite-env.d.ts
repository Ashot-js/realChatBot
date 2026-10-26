/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Chat server origin, e.g. https://realchatbot.onrender.com (no trailing slash). */
  readonly VITE_SOCKET_URL?: string;
}
