const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const status = document.getElementById("status");
const onlineEl = document.getElementById("online");

let ws;
let myId = null;
let players = {};
const speed = 200;
let keys = {};

const WS_URL = "ws://" + location.host + "/ws";
connect(WS_URL);

// ✅ Ограничение отправки — 20 раз в секунду
let lastSend = 0;
const SEND_RATE = 50; // мс

function connect(url) {
  ws = new WebSocket(url);
  status.textContent = "подключение...";

  ws.onopen = () => (status.textContent = "подключено");

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);

    if (msg.type === "init") {
      myId = msg.you;
      players = msg.players || {};
      for (const id in players) {
        players[id].tx = players[id].x;
        players[id].ty = players[id].y;
      }
      updateOnline();
    }

    if (msg.type === "spawn") {
      players[msg.id] = {
        ...msg.player,
        tx: msg.player.x,
        ty: msg.player.y,
      };
      updateOnline();
    }

    if (msg.type === "move") {
      if (players[msg.id]) {
        players[msg.id].tx = msg.x;
        players[msg.id].ty = msg.y;
      }
    }

    if (msg.type === "despawn") {
      delete players[msg.id];
      updateOnline();
    }
  };

  ws.onclose = () => (status.textContent = "отключено");
}

function updateOnline() {
  onlineEl.textContent = Object.keys(players).length;
}

// управление
addEventListener("keydown", (e) => (keys[e.key] = true));
addEventListener("keyup", (e) => (keys[e.key] = false));

// ✅ Интерполяция
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// игровой цикл
let last = performance.now();
function loop(t) {
  const dt = (t - last) / 1000;
  last = t;

  if (myId && players[myId]) {
    let moved = false;
    const p = players[myId];

    if (keys["ArrowUp"]) {
      p.y -= speed * dt;
      moved = true;
    }
    if (keys["ArrowDown"]) {
      p.y += speed * dt;
      moved = true;
    }
    if (keys["ArrowLeft"]) {
      p.x -= speed * dt;
      moved = true;
    }
    if (keys["ArrowRight"]) {
      p.x += speed * dt;
      moved = true;
    }

    const now = performance.now();
    if (moved && ws.readyState === 1 && now - lastSend > SEND_RATE) {
      ws.send(JSON.stringify({ type: "move", x: p.x, y: p.y }));
      lastSend = now;
    }
  }

  // ✅ ПЛАВНОЕ ПОДТЯГИВАНИЕ К ЦЕЛИ
  for (const id in players) {
    const p = players[id];
    p.x = lerp(p.x, p.tx ?? p.x, 0.15);
    p.y = lerp(p.y, p.ty ?? p.y, 0.15);
  }

  draw();
  requestAnimationFrame(loop);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const id in players) {
    const p = players[id];

    ctx.fillStyle = p.color || "red";
    ctx.fillRect(p.x - 12, p.y - 12, 24, 24);

    ctx.fillStyle = "#fff";
    ctx.fillText(id === myId ? "You" : id, p.x - 10, p.y - 15);
  }
}

requestAnimationFrame(loop);
