# Atrium

Approved design: the light surfaces of Aperture and the focused demonstration
stages of Chamber. Ink is the site and package default. This is one semantic
system with light and dark modes, not two separate visual identities.

## Tokens

Source of truth: packages/morphui/src/themes and src/styles/base.css.
Ink light: background #F8F7F5, surface #F0EEEA, text #171614, accent #1B1A17.
Ink dark: background #101010, surface #191918, text #EDEBE7, accent #EDEBE7.
Other presets: Green, Cobalt, Terracotta, Teal, Crimson, Plum.
Use the package's semantic variables, including contextual material tokens.

## Typography

Schibsted Grotesk for headings, body and controls, continuing the playground.
Monospace is confined to code. Body tracking is normal; large headings may have
slight negative tracking. No decorative eyebrows or widely spaced uppercase text.

## Shape and layout

Radii: 10, 16, 24, 34px and pill. Pills for primary actions; 24/34px for demo stages.
Home: generous left-aligned introduction beside a live component stage. Component
index is a row-based catalogue. Docs: familiar navigation rail, reading column,
small on-page navigation on wide screens. Collapse navigation for narrow screens.

## Motion

Use the package's existing curves and durations. Site navigation is immediate.
Shared text and images remain visible during the transition. Keep blur quality.
Controls respond without decorative entrance sequences. Honor reduced motion.
