import { WebSocketServer } from "ws";

const PORT = 8080;

// ОБЯЗАТЕЛЬНО 0.0.0.0
const wss = new WebSocketServer({
  port: PORT,
  host: "0.0.0.0"
});

const players = new Map();

wss.on("connection", (ws) => {
  const id = Date.now().toString();
  players.set(id, ws);

  console.log("Player connected:", id);

  // отправляем ID новому игроку
  ws.send(JSON.stringify({
    type: "init",
    id
  }));

  // рассылаем всем, что появился новый игрок
  broadcast({
    type: "join",
    id
  });

  ws.on("message", (msg) => {
    broadcast(JSON.parse(msg));
  });

  ws.on("close", () => {
    players.delete(id);
    broadcast({
      type: "leave",
      id
    });
  });
});

function broadcast(data) {
  const json = JSON.stringify(data);
  for (const ws of players.values()) {
    ws.send(json);
  }
}

console.log("WS server running on", PORT);
