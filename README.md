# Guess Who?

A browser-based **Guess Who?** game — no install, no build step, just open and play.

## How to Play

1. Open `index.html` in a browser (or serve it with any static file server)
2. Pick a mode:
   - **Solo Board** — Get your own board and coordinate with a friend over Discord/voice chat
   - **Pass & Play** — Two players on one device, passing back and forth
   - **Online** — Create or join a room to play remotely via peer-to-peer (WebRTC)
3. Eliminate characters by clicking them (they flip over). When you're ready, hit **Make Guess** and click who you think is your opponent's secret character.

## Character Packs

| Pack | Characters | Images |
|------|-----------|--------|
| Classic | 28 | Local (bundled) |
| Pop Stars | 24 | Wikipedia |
| Movie Stars | 24 | Wikipedia |
| Icons & Athletes | 24 | Wikipedia |
| New Wave | 24 | Wikipedia |

## Tech Stack

- **Vanilla JS** — No frameworks, no build tools
- **PeerJS** — WebRTC data channels for online multiplayer (loaded from CDN)
- **Wikipedia API** — Fetches character thumbnails for non-classic packs
- **CSS 3D Transforms** — Card flip animations

## Running Locally

```bash
# Option 1: Just open the file
open index.html

# Option 2: Serve it
python3 -m http.server
```

No `npm install`. No dependencies to manage.

## Project Structure

```
index.html      — Entry point and UI layout
characters.js   — Character pack data and Wikipedia title mappings
network.js      — PeerJS connection management and message protocol
game.js         — Game logic, DOM rendering, and state management
styles.css      — Responsive grid layout and card animations
images/classic/ — Bundled avatar images for the Classic pack
```
