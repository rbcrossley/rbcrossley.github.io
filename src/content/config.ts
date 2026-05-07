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
    author: z.string().default('cst'),
  }),
});

export const collections = { courses, topics, blog };
