---
title: MorphCard
description: A shared image carries the card into a full-screen view, and home again.
kind: card
order: 6
---

## Usage

Pass the card through the `card` prop. Put the same `data-morph-item` value on the image in the card and the matching image in the expanded content.

The card uses the full-screen variant. Its shared image has an independent visual layer, so closing blur and content lag do not hide the image on its way back.

## Use your own image

Use the same image source at both ends. CSS controls its size and crop. Give each image an explicit size or aspect ratio to keep measurements stable.

```jsx
<MorphCard
  aria-label="Mountain journal"
  card={
    <button aria-label="Read Mountain journal">
      <img data-morph-item="cover" src="/mountains.jpg" alt="" width={240} height={200} />
    </button>
  }
>
  <img data-morph-item="cover" src="/mountains.jpg" alt="Mountain landscape" width={1200} height={600} />
  <h2>Mountain journal</h2>
  <MorphClose><button>Back to the card</button></MorphClose>
</MorphCard>
```

## Make the card accessible

Use a real button for the trigger and give it a useful accessible name. Use meaningful alternative text for content images. If the button's label already describes the image, an empty `alt` avoids announcing the same thing twice.

## Keep the return visible

Keep the trigger mounted while its panel is open. The closing transition measures its current position. Avoid swapping or removing the trigger image until the close has finished.
