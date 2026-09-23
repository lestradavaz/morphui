import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /* `guide` is a page about the library. Everything else names the component
       the page documents, which is what picks the live preview, the example
       source and the props table the page is rendered with. */
    kind: z
      .enum([
        'guide',
        'dialog',
        'window',
        'card',
        'button',
        'switch',
        'checkbox',
        'radio',
        'input',
        'stepper',
        'tabs',
        'popover',
        'tooltip',
        'context-menu',
        'combobox',
        'multi-select',
        'save-button',
        'hold-button',
        'select',
        'expand',
      ])
      .default('guide'),
    order: z.number(),
  }),
});
export const collections = { docs };
