import rss from "@astrojs/rss";
import { SITE_TITLE, SITE_DESCRIPTION } from "../config";

// Load posts
let posts = Object.values(import.meta.glob("../posts/*.md", { eager: true }));

// Sort posts by updated or added date (most recent first)
posts = posts.sort(
	(a, b) =>
		new Date(b.frontmatter.updated || b.frontmatter.added).valueOf() -
		new Date(a.frontmatter.updated || a.frontmatter.added).valueOf()
);

// Generate the RSS feed
export const GET = () =>
	rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: import.meta.env.SITE,
		items: posts.map((post) => {
			const { slug, title, added, updated, description } = post.frontmatter;

			// Validate required fields and provide fallbacks
			if (!slug || !title || !added) {
				console.warn(
					`Post is missing required fields: ${JSON.stringify(post.frontmatter)}`
				);
				return null;
			}

			return {
				link: `/post/${slug}`,
				title: title || "Untitled Post",
				pubDate: new Date(added).toUTCString(), // Ensure valid date format
				description: description || "No description available.",
				content: post.compiledContent ? post.compiledContent() : "",
				customData: `<updated>${updated || ""}</updated>`,
			};
		}).filter(Boolean), // Remove null items
	});
