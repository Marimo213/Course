import { WebSocketServer } from "ws";

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT, host: "0.0.0.0" });

const players = new Map();

wss.on("connection", (ws) => {
  const id = Date.now().toString();

  const player = {
    x: 400,
    y: 300,
    color: "#" + Math.floor(Math.random() * 16777215).toString(16),
  };

  players.set(id, player);

  ws.send(
    JSON.stringify({
      type: "init",
      you: id,
      players: Object.fromEntries(players),
    }),
  );

  broadcast({
    type: "spawn",
    id,
    player,
  });

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "move" && players.has(id)) {
      players.get(id).x = data.x;
      players.get(id).y = data.y;

      broadcast({
        type: "move",
        id,
        x: data.x,
        y: data.y,
      });
    }
  });

  ws.on("close", () => {
    players.delete(id);

    broadcast({
      type: "despawn",
      id,
    });
  });
});

function broadcast(data) {
  const json = JSON.stringify(data);

  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(json);
    }
  }
}

console.log("WS server running on", PORT);
