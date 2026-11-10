import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';

const path = (file: string) => fileURLToPath(new URL(file, import.meta.url));

// Two pages: / (the truck) and /player.html (the player on its own).
export default defineConfig({
  appType: 'mpa',
  build: {
    rolldownOptions: {
      input: {
        index: path('./index.html'),
        player: path('./player.html'),
      },
    },
  },
});
