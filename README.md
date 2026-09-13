![RAINBOOM](cover.jpg)

# RAINBOOM

**Play:** [js13k](https://js13kgames.com/games/rainboom) ·
[itch.io](https://jupiter-wave.itch.io/rainboom) ·
[Wavedash](https://wavedash.com/games/rainboom)

**Shipped zip:** 13,307 / 13,312 bytes.

[WebXR](https://js13kgames.com/2026/webxr#libraries) incremental game for
[js13kGames 2026](https://js13kgames.com/2026). Blast grey rainbows until
they bloom, collect gold, spend it on a sky constellation.

A-Frame is loaded from the official js13k host and is **not** in the
13 KB zip. The zip is only our HTML, CSS, and game JS.

## Controls

**Desktop**
- Move the mouse to aim; hold click to blast
- Push the cursor to a screen edge, or use A / D / arrows, to look
- Aim at a skill node and fire to buy; aim at **GO** to start the next
  round

**WebXR**
- **ENTER XR** on the title screen (shown when a headset is available)
- Point with the controller (or look); pull trigger to blast and buy

WebXR needs HTTPS. `npm start` is HTTP only; Quest won't enter VR on it.

Test on a public HTTPS URL:

1. Deploy to itch (or publish on Wavedash), **or** run
   `cloudflared tunnel --url http://localhost:8080` while `npm start`
   is running.
2. On the Quest, open that `https://` URL in Meta Browser.
3. Tap **ENTER XR**. No button = blocked (HTTP, iframe, or old browser).

Wavedash embeds in an iframe. If XR works on itch/js13k but not Wavedash,
open the game in a top-level tab.

## Stack

- Vanilla JS, one A-Frame scene, Three.js via A-Frame
- Official extra library:
  [`play.js13kgames.com/2026/webxr/aframe.js`](https://play.js13kgames.com/2026/webxr/aframe.js)
- Web Audio beeps (no samples)
- Optional [Wavedash](https://js13kgames.com/2026/wavedash) host SDK
  (load progress + `Wavedash.init()` on scene ready; optional gold
  leaderboard; no-op if missing)
- Build: esbuild, Roadroller, Zopfli / ECT → `dist/game.zip` and
  `dist/web/index.html`

```
npm start          # http://localhost:8080
npm run build      # zip, fail if over 13312 bytes
```

## Deploy

`npm run build` writes `dist/game.zip` (js13k) and `dist/web/index.html`
(Wavedash and itch). Push to `main` (or run the **Deploy** workflow)
uploads both. Wavedash upload is not live until you click **Publish**
in the [Developer Portal](https://wavedash.com/dev).

### One-time setup

Create a GitHub Environment named **prod** (the workflow reads
secrets and vars from it). Repo → **Settings** → **Environments** →
**New environment** → `prod`. Leave protection rules empty unless you
want a manual approval gate.

Then on that environment:

**Secrets** (Environment secrets, not repository secrets)

| Name | Where to get it |
| --- | --- |
| `WAVEDASH_TOKEN` | [wavedash.com/dev](https://wavedash.com/dev) → **API Keys** → **Create API key**. Shown once. |
| `BUTLER_API_KEY` | itch.io → [user settings → API keys](https://itch.io/user/settings/api-keys) → Generate |

**Variables** (Environment variables)

| Name | Where to get it |
| --- | --- |
| `WAVEDASH_GAME_ID` | Same id as `game_id` in `wavedash.toml` (portal game URL / `wavedash init`) |
| `ITCH_USER` | Your itch.io username |
| `ITCH_GAME` | The project slug from `https://itch.io/game/edit/USER/SLUG` |

After the first CI run: **Publish** on Wavedash. Fill store metadata:
title, description, **1:1 square** cover (no letterboxing; `cover.jpg`
is not square), 3-5 screenshots, tags. Game should load to 100% and call
`Wavedash.init()`.

js13k Wavedash publish window closes 20 Sep 2026 (deploy only). Achievements
optional.

## Keeping the zip small

- A-Frame / Three stay on the js13k CDN; never bundled
- One `index.html` in the zip (inlined JS, stripped markup)
- esbuild minify + IIFE; Roadroller when it wins
- Zopfli DEFLATE, then ECT / advzip
- Packed integer skill defs; typed arrays for run state
- Shared Three geometries; canvas text instead of font files
- Procedural audio and meshes; no images, models, or webfonts
- Object pools (coins, rainbows); short names after minify

## What if I had 1 KiB more?

13 bytes left. With another KiB I'd try:

- **VR gestures**: pinch to buy, palm-up for skills, flick to wipe clusters
- **Achievements**: local milestones (first bloom, full tree, round 10), plus
  [Wavedash](https://wavedash.com/dev) if there's room
- **Save**: `localStorage` for gold, unlocked nodes, round
- **Audio**: better bloom/coin SFX, short procedural background loop

Not all of that fits in 1 KiB. Realistically: save + one gesture, or
achievements + audio.
