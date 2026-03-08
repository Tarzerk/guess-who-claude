// ─── Game state ───
let offlineMode = false;
let myCard = "";
let eliminated = new Set();
let guessMode = false;
let gameOver = false;
let myTurn = false;
let gameCharacters = [];
const imageCache = {};

// ─── Image fetching with error logging ───
async function fetchImages() {
  const names = gameCharacters.length ? gameCharacters : [];
  if (!names.length) {
    console.warn("[Images] No characters to fetch images for");
    return;
  }

  const wikiTitles = names.map(n => WIKI_TITLES[n]).filter(Boolean);
  const missingTitles = names.filter(n => !WIKI_TITLES[n]);
  if (missingTitles.length) {
    console.error("[Images] Missing Wikipedia titles for:", missingTitles);
  }

  const titlesParam = wikiTitles.map(t => encodeURIComponent(t.replace(/_/g, " "))).join("|");
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${titlesParam}&prop=pageimages&pithumbsize=200&format=json&origin=*&redirects=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("[Images] Wikipedia API returned status:", res.status, res.statusText);
      return;
    }
    const data = await res.json();

    if (!data.query || !data.query.pages) {
      console.error("[Images] Unexpected Wikipedia API response:", data);
      return;
    }

    const pages = data.query.pages;
    const titleToThumb = {};
    let loadedCount = 0;
    let missingCount = 0;

    for (const id in pages) {
      const page = pages[id];
      if (page.thumbnail) {
        titleToThumb[page.title.toLowerCase()] = page.thumbnail.source;
        loadedCount++;
      } else {
        missingCount++;
        console.warn("[Images] No thumbnail found for page:", page.title);
      }
    }

    // Handle redirects (e.g. "Adele" → "Adele (singer)")
    if (data.query.redirects) {
      for (const r of data.query.redirects) {
        const target = r.to.toLowerCase();
        if (titleToThumb[target]) {
          titleToThumb[r.from.toLowerCase()] = titleToThumb[target];
        }
      }
    }

    // Map display names to image URLs
    for (const name of names) {
      const wikiTitle = WIKI_TITLES[name];
      if (!wikiTitle) continue;
      const normalized = wikiTitle.replace(/_/g, " ").replace(/%27/g, "'").toLowerCase();
      if (titleToThumb[normalized]) {
        imageCache[name] = titleToThumb[normalized];
      } else {
        console.error("[Images] Could not resolve image for:", name, "(wiki title:", wikiTitle + ")");
      }
    }

    console.log(`[Images] Loaded ${loadedCount} images, ${missingCount} missing from API`);

    // Update rendered cards
    document.querySelectorAll(".card .avatar").forEach(img => {
      const name = img.closest(".card").dataset.name;
      if (imageCache[name]) {
        img.src = imageCache[name];
      } else {
        console.warn("[Images] No cached image for card:", name);
      }
    });
  } catch (e) {
    console.error("[Images] Failed to fetch Wikipedia images:", e);
  }
}

function handleImageError(img, characterName) {
  console.error("[Images] Failed to load image for:", characterName, "src:", img.src);
  img.style.display = "none";
}

// ─── Offline / Discord Mode ───
function startOffline() {
  offlineMode = true;
  myTurn = true;
  const packSelect = document.getElementById("packSelect");
  const packName = packSelect.value;
  gameCharacters = [...CHARACTER_PACKS[packName]];
  myCard = gameCharacters[Math.floor(Math.random() * gameCharacters.length)];
  document.getElementById("lobby").style.display = "none";
  document.getElementById("gameContainer").classList.add("visible");
  document.getElementById("roomBadge").innerHTML = `<strong>Offline</strong> &mdash; ${packName}`;
  document.getElementById("endTurnBtn").style.display = "none";
  renderBoard();
  updateTurnUI();
  fetchImages();
}

// ─── Game UI ───
function startGame(packName) {
  document.getElementById("lobby").style.display = "none";
  document.getElementById("gameContainer").classList.add("visible");
  let badge = `Room: <strong>${roomId}</strong>`;
  if (packName) badge += ` &mdash; ${packName}`;
  document.getElementById("roomBadge").innerHTML = badge;
  renderBoard();
  updateTurnUI();
  fetchImages();
}

function updateTurnUI() {
  const info = document.getElementById("turnInfo");
  if (offlineMode) {
    info.textContent = "Eliminate characters, then Make Guess when ready!";
    info.className = "turn-info your-turn";
    document.getElementById("guessBtn").disabled = false;
    return;
  }
  if (myTurn) {
    info.textContent = "Your Turn — eliminate characters or make a guess!";
    info.className = "turn-info your-turn";
  } else {
    info.textContent = "Opponent's Turn — waiting...";
    info.className = "turn-info their-turn";
  }
  document.getElementById("guessBtn").disabled = !myTurn;
  document.getElementById("endTurnBtn").disabled = !myTurn;

  if (!myTurn && guessMode) {
    guessMode = false;
    document.getElementById("guessBtn").classList.remove("active");
    document.getElementById("guessHint").classList.remove("visible");
    document.getElementById("grid").classList.remove("guess-mode");
  }
}

function renderBoard() {
  const badge = document.getElementById("myCardBadge");
  badge.innerHTML = `Your card: <strong>${myCard}</strong>`;

  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  gameCharacters.forEach(name => {
    const card = document.createElement("div");
    card.className = "card" + (eliminated.has(name) ? " eliminated" : "");
    const imgSrc = imageCache[name] || "";
    card.innerHTML = `<img class="avatar" src="${imgSrc}" alt="${name}" onerror="handleImageError(this, '${name.replace(/'/g, "\\'")}')"><span class="name">${name}</span>`;
    card.dataset.name = name;
    card.addEventListener("click", () => handleCardClick(card));
    grid.appendChild(card);
  });

  guessMode = false;
  document.getElementById("guessBtn").classList.remove("active");
  document.getElementById("guessHint").classList.remove("visible");
  grid.classList.remove("guess-mode");
}

function handleCardClick(card) {
  if (gameOver) return;
  const name = card.dataset.name;

  if (guessMode) {
    if (!myTurn) return;
    if (card.classList.contains("eliminated")) return;
    makeGuess(name);
    return;
  }

  if (eliminated.has(name)) {
    eliminated.delete(name);
    card.classList.remove("eliminated");
  } else {
    eliminated.add(name);
    card.classList.add("eliminated");
  }
}

function toggleGuessMode() {
  if (gameOver || (!myTurn && !offlineMode)) return;
  guessMode = !guessMode;
  document.getElementById("guessBtn").classList.toggle("active", guessMode);
  document.getElementById("guessHint").classList.toggle("visible", guessMode);
  document.getElementById("grid").classList.toggle("guess-mode", guessMode);
}

function makeGuess(name) {
  gameOver = true;
  guessMode = false;
  document.getElementById("guessBtn").classList.remove("active");
  document.getElementById("guessHint").classList.remove("visible");
  document.getElementById("grid").classList.remove("guess-mode");

  if (offlineMode) {
    const modal = document.getElementById("modal");
    const title = document.getElementById("modalTitle");
    const text = document.getElementById("modalText");
    modal.className = "modal win";
    title.textContent = "Your Guess";
    text.innerHTML = `You guessed <span class="highlight">${name}</span>!<br><br><span style="color:#aaa;font-size:0.9rem;">Ask your opponent if you're right!</span>`;
    document.getElementById("overlay").classList.add("visible");
    return;
  }

  conn.send({ type: "guess", name });

  const info = document.getElementById("turnInfo");
  info.textContent = "Waiting for result...";
  info.className = "turn-info their-turn";
}

function showResult(iWon, guessedName, actualCard) {
  gameOver = true;
  const modal = document.getElementById("modal");
  const title = document.getElementById("modalTitle");
  const text = document.getElementById("modalText");

  if (iWon) {
    modal.className = "modal win";
    title.textContent = "You Win!";
    text.innerHTML = `The mystery person was <span class="highlight">${actualCard}</span>.`;
  } else {
    modal.className = "modal lose";
    title.textContent = "You Lose!";
    text.innerHTML = `Guessed <strong>${guessedName}</strong>, but the answer was <span class="highlight">${actualCard}</span>.`;
  }

  document.getElementById("overlay").classList.add("visible");
}

function showDisconnect() {
  gameOver = true;
  const modal = document.getElementById("modal");
  const title = document.getElementById("modalTitle");
  const text = document.getElementById("modalText");
  modal.className = "modal lose";
  title.textContent = "Disconnected";
  text.textContent = "Your opponent left the game.";
  document.getElementById("overlay").classList.add("visible");
}

function resetBoard() {
  if (gameOver) return;
  eliminated.clear();
  renderBoard();
  updateTurnUI();
}

// Allow pressing Enter in room code input
document.getElementById("roomCode").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    joinRoom();
  }
});
