let ws;

function resolveWebSocketUrl() {
    const qpUrl = new URLSearchParams(location.search).get("ws");
    if (qpUrl) return qpUrl;
    if (location.hostname) return `ws://${location.hostname}:8080`;
    return "ws://localhost:8080";
}

export function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) return ws;

    ws = new WebSocket(resolveWebSocketUrl());

    ws.onopen = () => console.log("Connected to WebSocket server");
    ws.onclose = () => {
        console.log("WebSocket closed, retrying...");
        setTimeout(connectWebSocket, 2000);
    };

    return ws;
}

export function getWebSocket() {
    return ws;
}
