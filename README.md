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
- **Pause:** Escape

## What changed in this iteration?

- A lush outdoor world replaces the claustrophobic dungeon. Expect meadows,
  rivers, plazas, houses, lamps, signs, and plenty of environmental storytelling.
- Combat balance is tuned for a relaxed adventure: enemies spawn slowly, projectiles
  are readable, and the hero has tools such as shields, dash trails, and healing
  perks to stay alive.
- The HUD is cleaner and richer: map clues, a living event log, skill sparks, and
  achievements live in translucent panels while the action fills the screen.
- Pause the game with **Escape** to open a dedicated menu with controls and restart
  options; gameplay halts while the menu is open.
- Level ups now open a dynamic upgrade selection overlay that actually grants new
  mechanics like twin shots, aurora shields, glowing slow fields, and more.
- Fresh particle FX, smooth movement interpolation, and pastel color palettes bring
  a warmer, more inviting feel to the scene.

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
