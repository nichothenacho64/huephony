export function resolveWebSocketUrl() {
    const qpUrl = new URLSearchParams(location.search).get("ws");
    if (qpUrl) return qpUrl;
    if (location.hostname) return `ws://${location.hostname}:8080`;
    return "ws://192.168.0.25:8080";
}

export function connectWebSocket(ws) {
    ws.onopen = () => console.log("Connected to WebSocket server");

    ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "keyPressed" && data.key !== resetKey) {
            await addDisabledKey(data.key);
            setGradient();
        } else if (data.type === "reset") {
            disabledKeys = [];
            setGradient();
            worker.port.postMessage({ type: "stopAll" });
            localStorage.removeItem("soundsPlaying");
        }
    };
}
