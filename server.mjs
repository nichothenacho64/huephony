import http from "http";
import { WebSocketServer } from "ws";
import { spawn } from "child_process";

const server = http.createServer();
const wss = new WebSocketServer({ server });

const httpServer = spawn("python3", ["-m", "http.server", "3000"]);

httpServer.on("close", (code) => {
    console.log(`Server process exited with code ${code}`);
});

httpServer.on("error", (err) => {
    console.error("Failed to start process:", err);
});

wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("message", (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw);
        } catch {
            return;
        }
        wss.clients.forEach((client) => {
            if (client.readyState === ws.OPEN) {
                client.send(JSON.stringify(msg));
            }
        });
    });

    ws.on("close", () => console.log("Client disconnected"));
});

const PORT = process.env.WS_PORT || 8080;
server.listen(PORT, () => {
    console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);
});
