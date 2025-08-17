
import { readFile } from "fs/promises";

async function findAudioFile(letter) {
    // const response = await fetch("audio_files.json"); 
    const jsonString = await readFile("audio_handling/audio_files.json", "utf-8"); /* plain JS */
    // const jsonData = await response.json(); 
    const jsonData = JSON.parse(jsonString); /* plain JS */
    const audioFiles = jsonData.files;


    const file = audioFiles.find(name =>
        name.toUpperCase().startsWith(letter.toUpperCase()) &&
        (name.endsWith(".mp3") || name.endsWith(".wav"))
    );

    console.log(file);
}

findAudioFile("B");

// ! end goal
// ! to have a FUNCTION that PLAYS a sound for each file