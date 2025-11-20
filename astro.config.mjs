import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
	site: "https://rbcrossley.github.io",
	base: "/",
	integrations: [sitemap({
      entryLimit: 50000,
      xmlns: {
        news: false,
        xhtml: false,
        image: false,
        video: false
      }
    })],
	markdown: {
		shikiConfig: {
			theme: "material-theme-darker",
			langs: [],
		},
	},
});