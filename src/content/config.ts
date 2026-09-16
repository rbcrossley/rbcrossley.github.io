import { defineCollection, z } from 'astro:content';

const courses = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    short: z.string(),
    icon: z.string(),
    description: z.string().optional(),
    sections: z.array(
      z.object({
        name: z.string(),
        topics: z.array(
          z.object({
            slug: z.string(),
            title: z.string(),
          })
        ),
      })
    ),
  }),
});

const topics = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    course: z.string(),
    section: z.string().optional(),
    description: z.string().optional(),
    order: z.number().optional(),
    discoverMore: z
      .array(
        z.object({
          title: z.string(),
          href: z.string(),
        })
      )
      .optional(),
  }),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    image: z.string().optional(),
    author: z.string().default('raju'),
    // Machine-readable topic tags. These never render on the page — they feed
    // the BlogPosting structured data and the article:tag meta tags so that
    // search engines can see what a post is about. Keep them accurate and
    // few (5–8); tags that do not describe the post are spam, not SEO.
    tags: z.array(z.string()).default([]),
    // Reader-facing category chips (see src/config/categories.ts). Different
    // from `tags` above: these DO render on the page (cards, filters) and are
    // a small fixed taxonomy, not free-form SEO keywords. A post may carry
    // more than one — e.g. ["linux", "devops"].
    categories: z
      .array(z.enum(['linux', 'devops', 'it-careers', 'it-education', 'loksewa']))
      .default([]),
  }),
});

export const collections = { courses, topics, blog };
