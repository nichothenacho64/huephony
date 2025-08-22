let webSocket;

const qpUrl = new URLSearchParams(location.search).get("ws");
const webSocketUrl = resolveWebSocketUrl(qpUrl);

export function resolveWebSocketUrl(url) {
    if (url) return url;
    if (location.hostname) return `ws://${location.hostname}:8080`;
    return "ws://localhost:8080";
}

export function connectWebSocket() {
    if (webSocket && webSocket.readyState === WebSocket.OPEN) return webSocket;

    webSocket = new WebSocket(webSocketUrl);

    webSocket.onopen = () => console.log("Connected to WebSocket server");
    webSocket.onclose = () => {
        console.log("WebSocket closed, retrying...");
        setTimeout(connectWebSocket, 2000);
    };

    return webSocket;
}