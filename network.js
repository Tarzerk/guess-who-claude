// ─── Network config ───
// TURN servers needed for cross-network play (different WiFi, states, etc.)
const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ]
};

const PEER_OPTS = { config: ICE_CONFIG };
const PEER_PREFIX = "guesswho-game-";

let peer = null;
let conn = null;
let isHost = false;
let roomId = "";

function setLobbyStatus(msg, isError) {
  const el = document.getElementById("lobbyStatus");
  el.textContent = msg;
  el.className = isError ? "status-msg error" : "status-msg";
}

function getRoomCode() {
  return document.getElementById("roomCode").value.trim().toUpperCase();
}

// ─── Create Room (Host) ───
function createRoom() {
  const code = getRoomCode();
  if (!code) { setLobbyStatus("Enter a room code first!", true); return; }
  roomId = code;
  isHost = true;
  setLobbyStatus("Creating room...");

  peer = new Peer(PEER_PREFIX + code, PEER_OPTS);

  peer.on("open", () => {
    setLobbyStatus(`Room "${code}" created! Waiting for opponent to join...`);
  });

  peer.on("connection", (connection) => {
    conn = connection;
    setupConnection();
    // Host picks a random pack for the board
    const packName = PACK_NAMES[Math.floor(Math.random() * PACK_NAMES.length)];
    currentPack = packName;
    gameCharacters = selectCharacters(packName);
    // Pick 2 different mystery cards from those 24
    const cardShuffled = [...gameCharacters].sort(() => Math.random() - 0.5);
    myCard = cardShuffled[0];     // host's card (guest tries to guess this)
    const guestCard = cardShuffled[1]; // guest's card (host tries to guess this)
    conn.on("open", () => {
      conn.send({ type: "start", yourCard: guestCard, characters: gameCharacters, pack: packName });
      myTurn = true; // host goes first
      startGame(packName);
    });
  });

  peer.on("error", (err) => {
    if (err.type === "unavailable-id") {
      setLobbyStatus(`Room "${code}" already exists. Try joining it instead!`, true);
    } else {
      setLobbyStatus("Connection error: " + err.message, true);
    }
    console.error("[Network] Peer error:", err);
  });
}

// ─── Join Room (Guest) ───
function joinRoom() {
  const code = getRoomCode();
  if (!code) { setLobbyStatus("Enter a room code first!", true); return; }
  roomId = code;
  isHost = false;
  setLobbyStatus("Connecting to room...");

  peer = new Peer(PEER_OPTS);

  peer.on("open", () => {
    conn = peer.connect(PEER_PREFIX + code, { reliable: true });

    conn.on("open", () => {
      setLobbyStatus("Connected! Waiting for game to start...");
      setupConnection();
    });

    conn.on("error", (err) => {
      setLobbyStatus("Could not connect: " + err.message, true);
      console.error("[Network] Connection error:", err);
    });
  });

  peer.on("error", (err) => {
    if (err.type === "peer-unavailable") {
      setLobbyStatus(`Room "${code}" not found. Ask your friend to create it first!`, true);
    } else {
      setLobbyStatus("Connection error: " + err.message, true);
    }
    console.error("[Network] Peer error:", err);
  });
}

// ─── Connection message handling ───
function setupConnection() {
  conn.on("data", (data) => {
    switch (data.type) {
      case "start":
        // Guest receives their card and the 24 characters for this game
        myCard = data.yourCard;
        gameCharacters = data.characters;
        currentPack = data.pack || "";
        myTurn = false; // host goes first
        startGame(data.pack || null);
        break;

      case "guess":
        // Opponent is guessing my card
        const correct = data.name === myCard;
        conn.send({ type: "guessResult", correct, actualCard: myCard, guessedName: data.name });
        if (correct) {
          showResult(false, data.name, myCard);
        } else {
          showResult(true, data.name, myCard);
        }
        break;

      case "guessResult":
        if (data.correct) {
          showResult(true, data.guessedName, data.actualCard);
        } else {
          showResult(false, data.guessedName, data.actualCard);
        }
        break;

      case "endTurn":
        myTurn = true;
        updateTurnUI();
        break;

      case "disconnect":
        if (!gameOver) {
          setLobbyStatus("Opponent disconnected!", true);
        }
        break;
    }
  });

  conn.on("close", () => {
    if (!gameOver) {
      showDisconnect();
    }
  });
}

function endTurn() {
  if (gameOver || !myTurn) return;

  if (localMultiplayer) {
    myTurn = false;
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    document.getElementById("myCardBadge").style.visibility = "hidden";
    showPassScreen("turn", nextPlayer);
    return;
  }

  myTurn = false;
  conn.send({ type: "endTurn" });
  updateTurnUI();
}
