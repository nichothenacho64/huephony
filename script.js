import { connectWebSocket } from "./webSockets.js"
import { scheduleRandomSound } from "./audio/audioProcessing.js"

const startHue = 0;
const defaultSaturation = 100;
const defaultLightness = 50;
const resetKey = "⌫";
const maxColours = 6;

const webSocket = connectWebSocket();

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const letterInformation = { 
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

            if (currentKey === resetKey) {
                disabledKeys = [];
                localStorage.removeItem("disabledKeys");
                webSocket.send(JSON.stringify({ type: "reset" }));
            }
        });
    });
}

function playPreviousKey() {
    let previousKey = localStorage.getItem("previousKeyClicked");
    console.log(`Previous key: ${previousKey}`);
    if (previousKey && previousKey !== resetKey) {
        console.log(`Key played: '${previousKey}'`);
        scheduleRandomSound(previousKey, webSocket);
        localStorage.removeItem("previousKeyClicked");
    }
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

function addGradientColours() {
    let gradientBackground = document.getElementById("gradient");

    if (!gradientBackground) return;

    let backgroundColours = disabledKeys.map(key => letterInformation[key].colour)
    console.log(backgroundColours);

    if (backgroundColours.length === 0) {
        gradientBackground.style.background = "#1e1e1e"; // is this necessary?
    } else {
        let gradientColours = [...backgroundColours, backgroundColours[0]].join(", ")
        gradientBackground.style.background = `conic-gradient(${gradientColours})`;
    }

}

function setGradient() {
    let previousKey = localStorage.getItem("previousKeyClicked");

    if (previousKey && previousKey !== resetKey) {
        if (!disabledKeys.includes(previousKey)) {
            disabledKeys.push(previousKey);
            localStorage.setItem("disabledKeys", JSON.stringify(disabledKeys));
        }
    }

    if (disabledKeys.length >= maxColours) {
        const removedKey = disabledKeys.shift();
        localStorage.setItem("disabledKeys", JSON.stringify(disabledKeys));
        console.log(`${removedKey} was removed from disabledKeys`);
    }


    disabledKeys.forEach(letter => disableKey(letter));

    addGradientColours();

    console.log(disabledKeys);
}

document.addEventListener("DOMContentLoaded", () => {
    connectWebSocket(webSocket);
    assignLetterHoverColours();
    getPreviousKey(); 
    setGradient();
    playPreviousKey();
});

webSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(`Data type: ${data.type}`)
    if (data.type === "keyPressed") {
        if (!disabledKeys.includes(data.key) && data.key !== resetKey && data.key) {
            disabledKeys.push(data.key);
            localStorage.setItem("disabledKeys", JSON.stringify(disabledKeys));
        };
        setGradient();
    } else if (data.type === "reset") {
        console.log("Reset event received via socket");
        disabledKeys = [];
        localStorage.removeItem("disabledKeys");
        setGradient(); 
    }
};
