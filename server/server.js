const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log("WS server running on", PORT);

const players = {}; // id -> {x,y,color}

function broadcast(msg) {
  const data = JSON.stringify(msg);
  wss.clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN) {
      c.send(data);
    }
  });
}

wss.on("connection", (ws) => {
  const id = uuidv4().slice(0, 8);

  players[id] = {
    x: 100 + Math.random() * 500,
    y: 100 + Math.random() * 300,
    color: randomColor(),
  };

  // Отправляем новому клиенту ВСЕХ игроков
  ws.send(
    JSON.stringify({
      type: "init",
      you: id,
      players,
    }),
  );

  // Сообщаем всем о новом игроке
  broadcast({
    type: "spawn",
    id,
    player: players[id],
  });

  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.type === "move") {
      if (players[id]) {
        players[id].x = msg.x;
        players[id].y = msg.y;

        broadcast({
          type: "move",
          id,
          x: msg.x,
          y: msg.y,
        });
      }
    }
  });

  ws.on("close", () => {
    delete players[id];
    broadcast({
      type: "despawn",
      id,
    });
  });
});

function randomColor() {
  return (
    "#" +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0")
  );
}
