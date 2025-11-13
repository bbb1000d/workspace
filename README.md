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

- Full-screen playfield with layered HUD panels for combat, progression, and logs
- Refined dungeon generator that stitches together multi-room chambers and caverns
- Enemy squads that pursue, fire arcane bolts, and scale up in wave-based assaults
- Player shooting, dashing, and reactive health/experience meters tied to skill points
- Clickable multi-tier skill tree with unlock requirements and impactful perks
- Achievement tracker that records milestones such as waves cleared or hits survived
- Activity log for recent actions and events
