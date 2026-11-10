import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// The panel is served under /admin (the Node API emails password-reset links to
// $ADMIN_URL/password/edit, with ADMIN_URL=http://localhost:3000/admin in development).
// In development /api is proxied to the Node backend, so no CORS setup is needed.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: "/admin/",
    plugins: [react()],
    server: {
      port: 3000,
      // never drift to 3001: that's the API's port
      strictPort: true,
      proxy: {
        "/api": { target: env.API_PROXY_TARGET || "http://localhost:3001", changeOrigin: true },
      },
    },
    preview: { port: 3000 },
    // same as hah-admin: the Datta Able theme SCSS emits @charset rules that Vite warns about
    css: {
      preprocessorOptions: { scss: { charset: false } },
      postcss: {
        plugins: [
          {
            postcssPlugin: "internal:charset-removal",
            AtRule: {
              charset: (atRule) => {
                if (atRule.name === "charset") atRule.remove();
              },
            },
          },
        ],
      },
    },
  };
});
