# Browser Roguelike Prototype

A lightweight roguelike experiment that runs entirely in the browser. Explore a
procedurally carved dungeon, evade roaming foes, and unlock a handful of early
skills while testing combat ideas.

## Getting Started

Open `index.html` in any modern browser. A local static server will also work if
you prefer one (`python -m http.server 8000`).

## Controls

- **Move:** Arrow keys or WASD
- **Shoot:** Space (fires in the last direction you moved)
- **Dash:** E (blink forward several tiles)

## Features

- Procedural dungeon generator with simple wandering rooms and corridors
- Enemy entities that pursue the player and inflict damage on contact
- Player projectiles, dash ability, and contact damage with a responsive health bar
- Experience progress bar and a three-step skill tree that enhances core abilities
- Activity log for recent actions and events
