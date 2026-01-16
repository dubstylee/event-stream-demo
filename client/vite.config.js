import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // CORS is handled by the Express server on port 4000
    // which allows http://localhost:* origins
  },
});