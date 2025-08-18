let audioOwner = null; // which tab owns playback

onconnect = (event) => {
    const port = event.ports[0];

    port.onmessage = (e) => {
        if (e.data.type === "register") {
            if (!audioOwner) {
                audioOwner = e.data.id; // first tab to register owns playback
                port.postMessage({ type: "play" });
            } else {
                port.postMessage({ type: "noop" });
            }
        }

        if (e.data.type === "release" && e.data.id === audioOwner) {
            audioOwner = null;
        }
    };
};
