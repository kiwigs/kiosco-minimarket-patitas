import type { NextConfig } from "next";
import withPWA from "next-pwa";

const baseConfig: NextConfig = {
  reactStrictMode: true,
};

const isDev = process.env.NODE_ENV === "development";

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: isDev, // ⬅️ PWA desactivado en desarrollo
})(baseConfig);
