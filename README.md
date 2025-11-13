# Wanderlight

A cozy, top-down action roguelike prototype built for the browser. Wander through a
hand-crafted-feeling valley, collect luminous memories, unlock wild upgrades, and
pause for a tea break at any time.

## Getting Started

Open `index.html` in any modern browser. Running a simple static server such as
`python -m http.server 8000` lets you play with the live reload conveniences of
your editor.

## Controls

- **Move:** WASD
- **Aim:** Arrow keys
- **Shoot:** Space
- **Dash:** E
- **Interact / Talk / Trade:** F
- **Pause:** Escape

## What changed in this iteration?

- The valley is now a connected overworld with two cozy towns, farmland, a firefly
  sanctuary, and dungeon entrances instead of a single arena. Safe places let you
  heal, decorate the scenery, and start house construction.
- Dungeons host all combat. They feature roaming mobs plus bespoke boss guardians
  that launch patterned barrages and drop valuable loot when defeated.
- Looting matters: enemies spill glow shards (currency) alongside timber, stone,
  and rare silk. Trade shards at town shops for weapon, armor, and potion upgrades,
  or haul building materials back home to raise your personal house.
- Towns feel alive thanks to NPCs with dialogue, journals to fill, illuminated
  lamps, market stalls, crop rows, and a story tracker that nudges you toward the
  next objective.
- Movement and visuals received a pass—acceleration-based motion, a smoothed
  camera, animated water, a full day/night sky cycle, glowing highlights, and new
  decorative sprites lend a modern polish.

## Project Structure

- `index.html` — Markup for the canvas, HUD layers, overlays, and toast system.
- `styles.css` — Visual design for the full-screen presentation, HUD panels, menus,
  and upgrade choices.
- `src/main.js` — Bootstraps the canvas sizing logic, UI binding, and kicks off the
  roguelike engine.
- `src/roguelike.js` — The meat of the experience: input handling, world generation,
  rendering, combat systems, upgrades, achievements, and progression flow.

Enjoy strolling through the valley, collect every achievement, and feel free to
extend the systems with your own ideas.
