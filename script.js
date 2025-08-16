let defaultStartHue = 0;

const defaultSaturation = 100;
const defaultLightness = 50;
const resetKey = "⌫";
const maxColours = 6;

// get a chatGPT description for each colour

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

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

let disabledKeys = JSON.parse(localStorage.getItem("disabledKeys")) || [];

// !! WEB SOCKET STUFF

// Resolve WebSocket URL: ?ws=ws://IP:5500  OR default to same host
function resolveWsUrl() {
    const qpUrl = new URLSearchParams(location.search).get("ws");
    if (qpUrl) return qpUrl;
    if (location.hostname) return `ws://${location.hostname}:5500`;
    // Fallback for file:// usage — replace this with the server machine's LAN IP:
    return "ws://192.168.1.50:5500";
}

const ws = new WebSocket(resolveWsUrl());

ws.onopen = () => console.log("Connected to WebSocket server");

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "keyPressed") {
        addDisabledKey(data.key);
        setGradient();
    } else if (data.type === "reset") {
        disabledKeys = [];
        setGradient();
    }
};

// !!

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

function getLetterColour(letter, startHue = 0) {
    const index = letters.indexOf(letter.toUpperCase());
    if (index === -1) {
        throw new Error(`Invalid letter: ${letter}`);
    }
    const hue = (startHue + (360 / letters.length) * index) % 360;
    return hslToHex(hue, defaultSaturation, defaultLightness);
}

function assignLetterHoverColours(startHue = 0) {
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

function setGradient() {
    let previousKey = localStorage.getItem("previousKeyClicked");

    if (previousKey && previousKey !== resetKey) {
        addDisabledKey(previousKey);
        localStorage.removeItem("previousKeyClicked");
        console.log(`Key clicked: '${previousKey}'`);
    }
    limitDisabledKeys();
    addGradientColour();
    disabledKeys.forEach(letter => disableKey(letter));
    getPreviousKey();
}

function getPreviousKey() {
    document.querySelectorAll(".key").forEach(key => {
        key.addEventListener("click", function () {
            let currentKey = this.textContent.trim().toUpperCase();
            localStorage.setItem("previousKeyClicked", currentKey);

            if (currentKey === resetKey) {
                localStorage.removeItem("disabledKeys");
            }

            // ! web socket stuff
            ws.send(JSON.stringify({ type: "keyPressed", key: currentKey }));

            if (currentKey === resetKey) {
                disabledKeys = [];
                ws.send(JSON.stringify({ type: "reset" }));
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
            keyElement.style.background = getLetterColour(key, defaultStartHue);
        }); // console.log(`Disabled key: ${key}`);
    } else {
        setTimeout(() => disableKey(key), 1000);
    }
}

function addDisabledKey(previousKey) {
    if (!disabledKeys.includes(previousKey)) {
        disabledKeys.push(previousKey);
        localStorage.setItem("disabledKeys", JSON.stringify(disabledKeys));
    }
}

function limitDisabledKeys() {
    if (disabledKeys.length >= maxColours) { // only if the quota is not yet reached
        console.log(disabledKeys);
        const removedKey = disabledKeys.shift(); // removes the first key
        localStorage.setItem("disabledKeys", JSON.stringify(disabledKeys));
        console.log(`${removedKey} was removed from disabledKeys`);
        // const randomIndex = Math.floor(Math.random() * disabledKeys.length);
        // disabledKeys.splice(randomIndex, 1);
        // console.log(`${disabledKeys[randomIndex]} was removed`)
    }
}


function addGradientColour() {
    let gradientBackground = document.getElementById("gradient");

    if (!gradientBackground) return;

    let backgroundColours = disabledKeys.map(disabledKey => letterInformation[disabledKey].colour)

    let gradientColours = [...backgroundColours, backgroundColours[0]].join(", ")
    gradientBackground.style.background = `conic-gradient(${gradientColours})`;
    console.log(gradientColours)
}

document.addEventListener("DOMContentLoaded", () => {
    assignLetterHoverColours(defaultStartHue);
    setGradient();
});