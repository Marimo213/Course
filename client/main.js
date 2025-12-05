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

function connect(url) {
  ws = new WebSocket(url);
  status.textContent = "подключение...";

  ws.onopen = () => (status.textContent = "подключено");

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);

    if (msg.type === "init") {
      myId = msg.you;
      players = msg.players;
      updateOnline();
    }

    if (msg.type === "spawn") {
      players[msg.id] = msg.player;
      updateOnline();
    }

    if (msg.type === "move") {
      if (players[msg.id]) {
        players[msg.id].x = msg.x;
        players[msg.id].y = msg.y;
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

    if (moved && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: "move", x: p.x, y: p.y }));
    }
  }

  draw();
  requestAnimationFrame(loop);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const id in players) {
    const p = players[id];

    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 12, p.y - 12, 24, 24);

    ctx.fillStyle = "#fff";
    ctx.fillText(id === myId ? "You" : id, p.x - 10, p.y - 15);
  }
}

requestAnimationFrame(loop);
