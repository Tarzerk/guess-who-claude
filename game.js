// ─── Game state ───
let offlineMode = false;
let myCard = "";
let eliminated = new Set();
let guessMode = false;
let gameOver = false;
let myTurn = false;
let gameCharacters = [];
let currentPack = "";
const imageCache = {};

// ─── Local multiplayer state ───
let localMultiplayer = false;
let currentPlayer = 1;
let player1Card = "";
let player2Card = "";
let player1Eliminated = new Set();
let player2Eliminated = new Set();
let passPhase = "";
let passPlayerNum = 1;

// ─── Screen navigation ───
function showScreen(screenId) {
  document.querySelectorAll(".lobby-screen").forEach(el => el.style.display = "none");
  document.getElementById(screenId).style.display = "";
}

function selectCharacters(packName) {
  return [...CHARACTER_PACKS[packName]];
}

// ─── Image fetching with error logging ───
async function fetchImages() {
  if (currentPack === "Classic") {
    gameCharacters.forEach(name => {
      imageCache[name] = `images/classic/${name}.png`;
    });
    document.querySelectorAll(".card-front .avatar").forEach(img => {
      const name = img.closest(".card").dataset.name;
      if (imageCache[name]) {
        img.src = imageCache[name];
        img.style.display = "";
      }
    });
    return;
  }
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
    document.querySelectorAll(".card-front .avatar").forEach(img => {
      const name = img.closest(".card").dataset.name;
      if (imageCache[name]) {
        img.src = imageCache[name];
        img.style.display = "";
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
  const packName = document.getElementById("soloPackSelect").value;
  currentPack = packName;
  gameCharacters = selectCharacters(packName);
  myCard = gameCharacters[Math.floor(Math.random() * gameCharacters.length)];
  hideAllLobbyScreens();
  document.getElementById("gameContainer").classList.add("visible");
  document.getElementById("roomBadge").innerHTML = `<strong>Offline</strong> &mdash; ${packName}`;
  document.getElementById("endTurnBtn").style.display = "none";
  renderBoard();
  updateTurnUI();
  fetchImages();
}

// ─── Local Multiplayer Mode ───
function startLocalMultiplayer() {
  localMultiplayer = true;
  myTurn = true;
  const packName = document.getElementById("localPackSelect").value;
  currentPack = packName;
  gameCharacters = selectCharacters(packName);

  // Pick 2 different mystery cards
  const shuffled = [...gameCharacters].sort(() => Math.random() - 0.5);
  player1Card = shuffled[0];
  player2Card = shuffled[1];

  // Start as Player 1
  currentPlayer = 1;
  myCard = player1Card;
  eliminated = player1Eliminated;

  hideAllLobbyScreens();
  document.getElementById("gameContainer").classList.add("visible");
  document.getElementById("roomBadge").innerHTML = `<strong>Local</strong> &mdash; ${packName}`;
  document.getElementById("myCardBadge").style.visibility = "hidden";

  renderBoard();
  fetchImages();

  // Start card reveal flow
  showPassScreen("reveal", 1);
}

function swapToPlayer(playerNum) {
  currentPlayer = playerNum;
  if (playerNum === 1) {
    myCard = player1Card;
    eliminated = player1Eliminated;
  } else {
    myCard = player2Card;
    eliminated = player2Eliminated;
  }
}

function showPassScreen(phase, playerNum) {
  passPhase = phase;
  passPlayerNum = playerNum;

  const title = document.getElementById("passTitle");
  const text = document.getElementById("passText");
  const btn = document.getElementById("passBtn");

  document.getElementById("myCardBadge").style.visibility = "hidden";

  if (phase === "reveal") {
    title.textContent = `Player ${playerNum}`;
    text.innerHTML = "Make sure only <strong>you</strong> can see the screen, then press Continue to see your secret character.";
    btn.textContent = "Show My Character";
  } else if (phase === "showCard") {
    swapToPlayer(playerNum);
    title.textContent = `Player ${playerNum}'s Secret Character`;
    text.innerHTML = `<div class="card-reveal">${myCard}</div>Remember this! Your opponent will try to guess this character.`;
    btn.textContent = "Got It";
  } else if (phase === "turn") {
    title.textContent = `Player ${playerNum}'s Turn`;
    text.innerHTML = "Make sure only <strong>you</strong> can see the screen, then press Continue to play your turn.";
    btn.textContent = "Continue";
  }

  document.getElementById("passOverlay").classList.add("visible");
}

function handlePassAction() {
  if (passPhase === "reveal") {
    // Show the card
    showPassScreen("showCard", passPlayerNum);
  } else if (passPhase === "showCard") {
    if (passPlayerNum === 1) {
      // Now reveal Player 2's card
      showPassScreen("reveal", 2);
    } else {
      // Both players have seen their cards — start gameplay
      document.getElementById("passOverlay").classList.remove("visible");
      beginLocalGameplay();
    }
  } else if (passPhase === "turn") {
    // Resume the turn
    document.getElementById("passOverlay").classList.remove("visible");
    resumeTurn(passPlayerNum);
  }
}

function beginLocalGameplay() {
  swapToPlayer(1);
  myTurn = true;
  renderBoard();
  document.getElementById("myCardBadge").style.visibility = "";
  updateTurnUI();
}

function resumeTurn(playerNum) {
  swapToPlayer(playerNum);
  myTurn = true;
  renderBoard();
  document.getElementById("myCardBadge").style.visibility = "";
  updateTurnUI();
}

function hideAllLobbyScreens() {
  document.querySelectorAll(".lobby-screen").forEach(el => el.style.display = "none");
}

// ─── Game UI ───
function startGame(packName) {
  hideAllLobbyScreens();
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
  if (localMultiplayer) {
    info.textContent = `Player ${currentPlayer}'s Turn — eliminate characters or make a guess!`;
    info.className = "turn-info your-turn";
    document.getElementById("guessBtn").disabled = false;
    document.getElementById("endTurnBtn").disabled = false;
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
    const imgSrc = imageCache[name];
    const imgTag = imgSrc
      ? `<img class="avatar" src="${imgSrc}" alt="${name}" onerror="handleImageError(this, '${name.replace(/'/g, "\\'")}')">`
      : `<img class="avatar" alt="${name}" onerror="handleImageError(this, '${name.replace(/'/g, "\\'")}')" style="display:none">`;
    card.innerHTML = `<div class="card-inner"><div class="card-front">${imgTag}<span class="name">${name}</span></div><div class="card-back"></div></div>`;
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
  if (gameOver || (!myTurn && !offlineMode && !localMultiplayer)) return;
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

  if (localMultiplayer) {
    const opponentCard = currentPlayer === 1 ? player2Card : player1Card;
    const correct = name === opponentCard;
    const modal = document.getElementById("modal");
    const title = document.getElementById("modalTitle");
    const text = document.getElementById("modalText");

    if (correct) {
      modal.className = "modal win";
      title.textContent = `Player ${currentPlayer} Wins!`;
      text.innerHTML = `Correctly guessed <span class="highlight">${name}</span>!`;
    } else {
      modal.className = "modal lose";
      title.textContent = `Player ${currentPlayer} Loses!`;
      text.innerHTML = `Guessed <strong>${name}</strong>, but the answer was <span class="highlight">${opponentCard}</span>.`;
    }
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
