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

    console.log(file);
    return "assets/audio_files/" + file;
}

export async function playAudio(key) {
    let audioFileName = await findAudioPath(key);
    let audio = new Audio(audioFileName);
    audio.play();
}

async function getAudioDuration(url) {
    return new Promise(resolve => {
        const audio = new Audio(url);
        audio.addEventListener("loadedmetadata", () => {
            resolve(audio.duration || 0);
        });
        audio.addEventListener("error", () => resolve(0));
    });
}


function getWeightedStart(duration, maxTime) {
    const normalized = Math.min(duration / maxTime, 1);
    const skewFactor = 1 + 4 * normalized;

    const rand = Math.random();
    return Math.floor(maxTime * Math.pow(rand, skewFactor));
}

export async function scheduleRandomSounds(disabledKeys) {
    const maxTime = 120; // seconds (2 minutes)

    for (const key of disabledKeys) {
        const url = await findAudioPath(key);
        if (!url) continue;

        const duration = await getAudioDuration(url);
        if (!duration) continue;

        const startTime = getWeightedStart(duration, maxTime) * 1000;

        console.log(`Scheduling ${key} at ${startTime / 1000}s (duration ~${duration}s)`);

        setTimeout(() => {
            playAudio(key);
        }, startTime);
    }
}


