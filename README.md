# 月光一閃 · 中秋賀卡

Mobile-first film greeting using the supplied child's original sword performance, Three.js, and Vite. No paid APIs or MotionSites subscription are required.

## Run

Node 22.12+ or 24 is recommended.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

## Experience

- Swipe across the stage or press the accessible start button.
- The original performance starts at 2.72 seconds. The impact is triggered by the video's actual playback position at 3.54 seconds, not a blind animation timeout.
- The cake separates into independent 3D halves with visible filling and yolks. Gold crumbs, a cyan blade, a brief hold, and slow playback emphasize the impact.
- The slash reaches the moon; a luminous crack and a ring fade as the moon returns to normal.
- The film holds at 5.20 seconds and blends into a still extracted at that timestamp. This keeps the ending frame consistent across Safari and Chromium. The greeting and replay button follow.

The supplied Prisma prompt informed the inset rounded film frame, dark/cream palette, large typography, and staggered greeting reveal. Its studio marketing sections and remote stock media are not included.

## Performance and fallbacks

- The web copy of the H.264 film is under 1 MB, audio-free, and uses fast-start MP4 metadata. The original source remains preserved in the repository.
- The renderer caps pixel density at 1.5 and animation at 45 fps, uses instanced crumbs, and pauses while the page is hidden.
- The page uses inline muted video with a gesture-initiated play call for Safari. Reduced-motion mode removes shake/flash and reduces particle count.
- A GPU/module failure does not prevent the film and final greeting from working. A failed video displays a notice and proceeds with the greeting.
- `vercel.json` specifies Vite and `dist` so the hosting preset cannot accidentally serve the old static page.

## Deployment

Public repository: https://github.com/jangjiajiun-collab/mid-autumn-moon-slice

Production: https://mid-autumn-moon-slice-video.vercel.app/

The child's photo and original video were explicitly approved for public GitHub and Vercel publication in the task conversation. No credentials belong in this repository.
