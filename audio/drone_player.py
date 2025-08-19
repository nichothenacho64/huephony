# audio/drone_player.py
from pathlib import Path
import pygame
import time
import random

pygame.mixer.init()

FOLDER_DIR = Path(__file__).resolve().parent.parent
DRONE_FILES_PATH = FOLDER_DIR / "assets" / "drones"
assert DRONE_FILES_PATH.exists(), f"{DRONE_FILES_PATH} does not exist"

drone_files = sorted([f for f in DRONE_FILES_PATH.iterdir() if f.suffix.lower() in [".wav", ".mp3", ".aif"]])
assert drone_files, "No drone files found in assets/drones/"

print(f"Loaded {len(drone_files)} drone sounds")

channel = pygame.mixer.Channel(0)

if len(drone_files) == 1:
    sound = pygame.mixer.Sound(str(drone_files[0]))
    print(f"Playing single drone: {drone_files[0].name}")
    channel.play(sound, loops=-1)
    while True:
        time.sleep(60)  
else:
    last_file = None
    while True:
        choices = [f for f in drone_files if f != last_file]
        drone_file = random.choice(choices)
        last_file = drone_file

        sound = pygame.mixer.Sound(str(drone_file))
        duration = sound.get_length()
        print(f"Now playing drone: {drone_file.name} ({duration:.2f}s)")

        channel.play(sound)
        time.sleep(duration)  

        # channel.fadeout(2000)
        # time.sleep(2)
