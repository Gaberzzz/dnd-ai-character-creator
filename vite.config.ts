import path from "path";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: "/",
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    cors: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    fs: {
      allow: [
        // Allow serving from the worktree itself
        ".",
        // Allow serving from the main repo's node_modules
        path.resolve(__dirname, "../../../"),
      ],
    },
  },
});
