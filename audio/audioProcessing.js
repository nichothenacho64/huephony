import { connectWebSocket } from "../webSockets.js";

async function findAudioPath(key) {
    const response = await fetch("audio/audio_filenames.json");
    const jsonData = await response.json();
    const audioFiles = jsonData.files;

    const file = audioFiles.find(name =>
        name.toUpperCase().startsWith(key.toUpperCase()) &&
        (name.endsWith(".mp3") || name.endsWith(".wav"))
    );

    if (!file) {
        console.warn(`No audio file found for key: ${key}`);
        return null;
    }

    return file; 
}

async function playAudio(key) {
    const file = await findAudioPath(key);
    if (!file) return;

    const ws = connectWebSocket();
    if (ws.readyState === WebSocket.OPEN) {
        console.log(`Open: ${file}`)
        ws.send(JSON.stringify({ type: "toggle", filename: file }));
    } else {
        ws.addEventListener("open", () => {
            console.log(`Play: ${file}`)
            ws.send(JSON.stringify({ type: "toggle", filename: file }));
        }, { once: true });
    }
}

async function getAudioDuration(filename) {
    const url = "assets/audio_files/" + filename;
    return new Promise(resolve => {
        const audio = new Audio(url);
        audio.addEventListener("loadedmetadata", () => resolve(audio.duration || 0));
        audio.addEventListener("error", () => resolve(0));
    });
}

export async function scheduleRandomSound(key) {
    const file = await findAudioPath(key);
    if (!file) return;

    const duration = await getAudioDuration(file);
    if (!duration) return;

    const startTime = 0;

    console.log(`Scheduling ${key} -> ${file} at ${startTime / 1000}s (duration ~${duration}s)`);
    playAudio(key);
}
