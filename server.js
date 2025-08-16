const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 5500 });

wss.on("connection", ws => {
    console.log("New client connected");

    ws.on("message", message => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on("close", () => {
        console.log("Client disconnected");
    });
});

console.log("WebSocket server running on ...");
