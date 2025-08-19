from pathlib import Path
from typing import Optional

import pygame

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

try:
    while True:
        filename = input()
        if (player := players_by_file.get(filename)) is not None:
            player.stop()
            del players_by_file[filename]
        else:
            player = AudioPlayerWrapper(filename)
            player.start()
            players_by_file[filename] = player
finally:
    for player in players_by_file.values():
        player.stop()