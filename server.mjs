import http from "http";
import { WebSocketServer } from "ws";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const server = http.createServer();
const wss = new WebSocketServer({ server });

const httpServer = spawn("python3", ["-m", "http.server", "3000"]);

const __filename = fileURLToPath(import.meta.url); // python audio
const __dirname = path.dirname(__filename);

const pythonPlayer = spawn("python3", [path.join(__dirname, "audio/audio_player.py")]);
const pythonDronePlayer = spawn("python3", [path.join(__dirname, "audio/drone_player.py")]);

httpServer.on("close", (code) => {
    console.log(`HTTP server exited with code ${code}`);
});

httpServer.on("error", (err) => {
    console.error("Failed to start HTTP server:", err);
});

pythonPlayer.stdout.on("data", (data) => {
    console.log(`[PYTHON]: ${data}`);
});

pythonPlayer.stderr.on("data", (data) => {
    console.error(`[PYTHON ERROR]: ${data}`);
});

pythonPlayer.on("close", (code) => {
    console.log(`Python player exited with code ${code}`);
});


pythonDronePlayer.stdout.on("data", (data) => {
    console.log(`[DRONE]: ${data}`);
});

pythonDronePlayer.stderr.on("data", (data) => {
    console.error(`[DRONE ERROR]: ${data}`);
});

pythonDronePlayer.on("close", (code) => {
    console.log(`Drone player exited with code ${code}`);
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

        if (msg.type === "toggle" && msg.filename) { // If this is a toggle request, send to Python player
            pythonPlayer.stdin.write(msg.filename + "\n");
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
