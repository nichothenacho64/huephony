from pathlib import Path
from typing import Optional
import pygame
import threading
import time
import random

pygame.mixer.init()

FOLDER_DIR = Path(__file__).resolve().parent.parent
AUDIO_FILES_PATH = FOLDER_DIR / "assets" / "audio_files"
assert AUDIO_FILES_PATH.exists(), f"{AUDIO_FILES_PATH} does not exist"

class AudioPlayerWrapper:
    def __init__(self, filename: str) -> None:
        self.path = AUDIO_FILES_PATH / filename
        assert self.path.exists(), f"File not found: {self.path}"
        self.sound = pygame.mixer.Sound(str(self.path))
        self.channel: Optional[pygame.mixer.Channel] = None

    def start(self):
        if self.channel is None or not self.channel.get_busy():
            self.channel = self.sound.play()

    def stop(self):
        if self.channel and self.channel.get_busy():
            self.channel.stop()

players_by_file: dict[str, AudioPlayerWrapper] = {}
schedulers: dict[str, threading.Event] = {}
times_by_file: dict[str, list[float]] = {}

def runner(filename: str):
    player = players_by_file[filename]
    stop_event = schedulers[filename]
    times = times_by_file[filename]
    start_time = time.time()
    for t in times:
        delay = t - (time.time() - start_time)
        if delay > 0:
            if stop_event.wait(timeout=delay):
                return
        if stop_event.is_set():
            return
        player.start()

def schedule_sound(filename: str, window: int = 60, min_gap: int = 2):
    player = players_by_file[filename]
    duration = player.sound.get_length()
    max_plays = max(1, int(window // (duration + min_gap)))
    times = [0.0]
    if max_plays > 1:
        latest_start = max(0, window - duration)
        random_times = [random.uniform(min_gap, latest_start) for _ in range(max_plays - 1)]
        times.extend(random_times)
    times_by_file[filename] = sorted(times)
    threading.Thread(target=runner, args=(filename,), daemon=True).start()

try:
    while True:
        filename = input().strip()
        if filename in players_by_file:
            schedulers[filename].set()
            players_by_file[filename].stop()
            del players_by_file[filename]
            del schedulers[filename]
            del times_by_file[filename]
        else:
            player = AudioPlayerWrapper(filename)
            players_by_file[filename] = player
            schedulers[filename] = threading.Event()
            schedule_sound(filename)
finally:
    for ev in schedulers.values():
        ev.set()
    for player in players_by_file.values():
        player.stop()
