import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3000",
      // kachenite snimki se servirat ot survura, ne ot Vite
      "/uploads": "http://localhost:3000",
    },
  },
});