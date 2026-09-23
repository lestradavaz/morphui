import packageJson from '../../../../packages/morphui/package.json';

/**
 * The facts every page repeats about itself. Kept in one place because a
 * canonical, a share card and a structured-data graph that disagree about the
 * same site are worse than none of them.
 */
export const SITE = {
  name: 'morphui',
  title: 'morphui · Interfaces that stay connected',
  description:
    'Morphing React components with shared elements, considered motion, and seven adaptable themes. Built with GSAP. Yours to make your own.',
  locale: 'en_US',
  language: 'en',
  repository: 'https://github.com/lestradavaz/morphui',
  npm: `https://www.npmjs.com/package/${packageJson.name}`,
  package: packageJson.name,
  version: packageJson.version,
  license: 'https://opensource.org/licenses/MIT',
  author: {
    name: 'Luis Manuel Estrada Vázquez',
    alternateName: 'lestradavaz',
    url: 'https://lestradavaz.com',
  },
  /** Authored at this exact size; a card that lies about its shape crops badly. */
  ogImage: { path: '/og-image.png', width: 1200, height: 630, type: 'image/png' },
} as const;
