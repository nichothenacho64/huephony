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

    let toHex = value => Math.round((value + matchValue) * 255)
                                .toString(16)
                                .padStart(2, '0');

    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}


function assignLetterHoverColours(startHue = 0) {
    const letters = [
        "A", "B", "C", "D", "E", "F", "G",
        "H", "I", "J", "K", "L", "M",
        "N", "O", "P", "Q", "R", "S",
        "T", "U", "V", "W", "X", "Y", "Z"
    ];
    const styleSheet = document.createElement('style');

    letters.forEach((letter, i) => {
        const hue = (startHue + 360 / letters.length * i) % 360;
        const hex = hslToHex(hue, 100, 50);
        styleSheet.innerHTML += `
            #${letter}:active {
                background-color: ${hex};
            }
        `;
    });
    document.head.appendChild(styleSheet);
}

document.addEventListener('DOMContentLoaded', () => {
    assignLetterHoverColours(0);
});