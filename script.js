import { resolveWebSocketUrl, connectWebSocket } from "./webSockets.js"
import { scheduleRandomSounds } from "./audio/audioProcessing.js" // playAudio, 

const startHue = 0;
const defaultSaturation = 100;
const defaultLightness = 50;
const resetKey = "⌫";
const maxColours = 6;

const webSocket = new WebSocket(resolveWebSocketUrl());

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const letterInformation = { // subject to change!!!!!
    "A": { colourLabel: "Colour A", soundLabel: "Sound A" },
    "B": { colourLabel: "Colour B", soundLabel: "Sound B" },
    "C": { colourLabel: "Colour C", soundLabel: "Sound C" },
    "D": { colourLabel: "Colour D", soundLabel: "Sound D" },
    "E": { colourLabel: "Colour E", soundLabel: "Sound E" },
    "F": { colourLabel: "Colour F", soundLabel: "Sound F" },
    "G": { colourLabel: "Colour G", soundLabel: "Sound G" },
    "H": { colourLabel: "Colour H", soundLabel: "Sound H" },
    "I": { colourLabel: "Colour I", soundLabel: "Sound I" },
    "J": { colourLabel: "Colour J", soundLabel: "Sound J" },
    "K": { colourLabel: "Colour K", soundLabel: "Sound K" },
    "L": { colourLabel: "Colour L", soundLabel: "Sound L" },
    "M": { colourLabel: "Colour M", soundLabel: "Sound M" },
    "N": { colourLabel: "Colour N", soundLabel: "Sound N" },
    "O": { colourLabel: "Colour O", soundLabel: "Sound O" },
    "P": { colourLabel: "Colour P", soundLabel: "Sound P" },
    "Q": { colourLabel: "Colour Q", soundLabel: "Sound Q" },
    "R": { colourLabel: "Colour R", soundLabel: "Sound R" },
    "S": { colourLabel: "Colour S", soundLabel: "Sound S" },
    "T": { colourLabel: "Colour T", soundLabel: "Sound T" },
    "U": { colourLabel: "Colour U", soundLabel: "Sound U" },
    "V": { colourLabel: "Colour V", soundLabel: "Sound V" },
    "W": { colourLabel: "Colour W", soundLabel: "Sound W" },
    "X": { colourLabel: "Colour X", soundLabel: "Sound X" },
    "Y": { colourLabel: "Colour Y", soundLabel: "Sound Y" },
    "Z": { colourLabel: "Colour Z", soundLabel: "Sound Z" }
};

const worker = new SharedWorker("audio/soundWorker.js");
const id = Math.random().toString(36).slice(2); // unique per page

let audio;

worker.port.onmessage = (e) => {
    if (e.data.type === "play" && !audio) {
        audio = new Audio("assets/drones/a_drone.wav"); // Only one page will actually play
        audio.loop = true;
        audio.play().catch(err => {
            console.log("Autoplay blocked until user clicks:", err);
        });
    }
};

worker.port.postMessage({ type: "register", id });

window.addEventListener("beforeunload", () => {
    worker.port.postMessage({ type: "release", id });
});


let disabledKeys = JSON.parse(localStorage.getItem("disabledKeys")) || [];

function hslToHex(hueDegrees, saturationPercent, lightnessPercent) {
    let saturation = saturationPercent / 100; // convert percentages to a range of 0 to 1
    let lightness = lightnessPercent / 100;

    let chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;

    let hueSection = (hueDegrees / 60) % 2;
    let secondLargestComponent = chroma * (1 - Math.abs(hueSection - 1));

    let matchValue = lightness - chroma / 2;

    let red = 0, green = 0, blue = 0;

    if (0 <= hueDegrees && hueDegrees < 60) {
        red = chroma; green = secondLargestComponent; blue = 0;
    } else if (60 <= hueDegrees && hueDegrees < 120) {
        red = secondLargestComponent; green = chroma; blue = 0;
    } else if (120 <= hueDegrees && hueDegrees < 180) {
        red = 0; green = chroma; blue = secondLargestComponent;
    } else if (180 <= hueDegrees && hueDegrees < 240) {
        red = 0; green = secondLargestComponent; blue = chroma;
    } else if (240 <= hueDegrees && hueDegrees < 300) {
        red = secondLargestComponent; green = 0; blue = chroma;
    } else {
        red = chroma; green = 0; blue = secondLargestComponent;
    }

    let toHex = value => Math.round((value + matchValue) * 255).toString(16).padStart(2, "0");

    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function getLetterColour(letter) {
    const index = letters.indexOf(letter.toUpperCase());
    if (index === -1) {
        throw new Error(`Invalid letter: ${letter}`);
    }
    const hue = (startHue + (360 / letters.length) * index) % 360;
    return hslToHex(hue, defaultSaturation, defaultLightness);
}

function assignLetterHoverColours() {
    const styleSheet = document.createElement("style");

    letters.forEach(letter => {
        const hex = getLetterColour(letter, startHue);
        letterInformation[letter]["colour"] = hex;
        styleSheet.innerHTML += `
            #${letter}:active, #${letter}:hover {
                background-color: ${hex};
            }
        `;
    });

    document.head.appendChild(styleSheet);
}

function getPreviousKey() {
    document.querySelectorAll(".key").forEach(key => {
        key.addEventListener("click", function () {
            let currentKey = this.textContent.trim().toUpperCase();
            localStorage.setItem("previousKeyClicked", currentKey);

            webSocket.send(JSON.stringify({ type: "keyPressed", key: currentKey })); // ! needed?

            if (currentKey === resetKey) { // ! web socket additions
                localStorage.removeItem("disabledKeys");
                localStorage.removeItem("soundsPlaying");
                disabledKeys = [];
                webSocket.send(JSON.stringify({ type: "reset" }));
            }
        });
    });
}

function disableKey(key) {
    const keyElement = document.getElementById(key);
    if (keyElement) {
        requestAnimationFrame(() => {
            keyElement.classList.add("disabled");
            keyElement.setAttribute("disabled", "true");
            keyElement.style.background = getLetterColour(key, startHue);
        }); // console.log(`Disabled key: ${key}`);
    } else {
        setTimeout(() => disableKey(key), 1000);
    }
}

async function addDisabledKey(key) {
    if (!key || disabledKeys.includes(key)) return;

    disabledKeys.push(key);
    localStorage.setItem("disabledKeys", JSON.stringify(disabledKeys));

    // await playPersistentSound(key);
}

function limitDisabledKeys() {
    if (disabledKeys.length >= maxColours) {
        const removedKey = disabledKeys.shift();
        localStorage.setItem("disabledKeys", JSON.stringify(disabledKeys));
        console.log(`${removedKey} was removed from disabledKeys`);
    }
}

function addGradientColours() {
    let gradientBackground = document.getElementById("gradient");

    if (!gradientBackground) return;

    let backgroundColours = disabledKeys.map(key => letterInformation[key].colour)

    let gradientColours = [...backgroundColours, backgroundColours[0]].join(", ")
    gradientBackground.style.background = `conic-gradient(${gradientColours})`;
}

async function setGradient() {
    let previousKey = localStorage.getItem("previousKeyClicked");

    if (previousKey && previousKey !== resetKey) {
        await addDisabledKey(previousKey);
        localStorage.removeItem("previousKeyClicked");
        console.log(`Key clicked: '${previousKey}'`);
    }
    limitDisabledKeys();
    addGradientColours();

    disabledKeys.forEach(letter => disableKey(letter));
    // disabledKeys.forEach(letter => playAudio(letter));

    console.log(disabledKeys);
}

document.addEventListener("DOMContentLoaded", async () => {
    connectWebSocket(webSocket);
    assignLetterHoverColours();
    await setGradient();
    getPreviousKey();
    if (!window.location.pathname.endsWith("index.html")) {
        scheduleRandomSounds(disabledKeys);
    }
});

// page specificity –> no sounds when on index.html, only the drone
// add stuff in localStorage to dictate if a sound must be played within the first 10 seconds
