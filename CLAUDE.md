# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A browser-based "Guess Who?" game with two modes:
- **Offline/Discord mode**: Solo board where players coordinate over voice chat
- **Online mode**: Real-time P2P multiplayer via PeerJS (WebRTC)

## Running

No build step. Open `index.html` directly in a browser or serve with any static file server (e.g., `python3 -m http.server`). No package manager or dependencies to install — PeerJS is loaded from a CDN.

## Architecture

Four files, loaded in order by `index.html`:

1. **`characters.js`** — Character pack data (`CHARACTER_PACKS`) and `WIKI_TITLES` mapping display names to Wikipedia article titles for avatar image fetching. Classic pack has 28 characters; other packs have 24.
2. **`network.js`** — PeerJS connection management. Handles room creation (host) and joining (guest) via `PEER_PREFIX + roomCode` IDs. Host picks a random pack, assigns mystery cards, and sends `start` message. Message protocol uses `{type, ...}` objects over `conn.send()`.
3. **`game.js`** — All game logic and DOM manipulation. Manages game state (eliminated set, turn tracking, guess mode), renders the card grid, fetches Wikipedia thumbnail images via the MediaWiki API, and handles win/lose modals.
4. **`styles.css`** — Responsive layout with a 7-column grid (4 on mobile, 3 on small screens). Card flip animation uses CSS 3D transforms (`.card.eliminated .card-inner` rotates 180°).

## Key Patterns

- **No framework**: Vanilla JS with direct DOM manipulation. Global functions are called from `onclick` attributes in HTML.
- **State is global**: `myCard`, `eliminated`, `myTurn`, `guessMode`, `gameOver`, `gameCharacters` are module-level variables in `game.js`. `peer`, `conn`, `isHost`, `roomId` are in `network.js`.
- **Image loading**: `fetchImages()` batch-fetches thumbnails from Wikipedia's API, caches in `imageCache`, then updates already-rendered `<img>` elements. Images may load after the board renders.
- **Network protocol messages**: `start`, `guess`, `guessResult`, `endTurn`, `disconnect` — all sent as plain objects via PeerJS data channel.
- **Character packs**: Classic pack uses all 28 characters; other packs have 24. All characters in a pack are always used. Both offline players must pick the same pack manually; online mode auto-selects randomly.
