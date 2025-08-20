import http from "http";
import { WebSocketServer } from "ws";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const server = http.createServer();
const webSocketServer = new WebSocketServer({ server });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function logMessage(label, message, isError = false) {
    const prefix = `[${label}]`;
    if (isError) {
        console.error(`${prefix} ${message}`);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

function attachLogging(process, label) {
    process.stdout?.on("data", (data) => {
        logMessage(label, data.toString().trim());
    });
    process.stderr?.on("data", (data) => {
        logMessage(label, data.toString().trim(), true);
    });
    process.on("close", (code) => {
        logMessage(label, `exited with code ${code}`);
    });
    process.on("error", (err) => {
        logMessage(label, `failed to start: ${err}`, true);
    });
}

const httpServer = spawn("python3", ["-m", "http.server", "3000"]);
const pythonPlayer = spawn("python3", [path.join(__dirname, "audio/audio_player.py")]);
const pythonDronePlayer = spawn("python3", [path.join(__dirname, "audio/drone_player.py")]);

attachLogging(httpServer, "HTTP");
attachLogging(pythonPlayer, "PYTHON");
attachLogging(pythonDronePlayer, "DRONE");

webSocketServer.on("connection", (webSocket) => {
    logMessage("WS", "Client connected");

    webSocket.on("message", (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw);
        } catch (err) {
            logMessage("WS ERROR", `Invalid JSON: ${raw} (${err.message})`, true);
            return;
        }

        if (msg.type === "toggle" && msg.filename) { 
            pythonPlayer.stdin.write(msg.filename + "\n");
        }

        webSocketServer.clients.forEach((client) => {
            if (client.readyState === webSocket.OPEN) {
                client.send(JSON.stringify(msg));
            }
        });
    });

    webSocket.on("close", () => logMessage("WS", "Client disconnected"));
});

const PORT = process.env.WS_PORT || 8080;
server.listen(PORT, () => {
    logMessage("WS", `WebSocket server running on ws://0.0.0.0:${PORT}`);
});
