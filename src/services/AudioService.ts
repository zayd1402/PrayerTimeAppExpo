// Adhan playback. Uses expo-audio, which Expo Go includes (expo-av was dropped from it).
import { createAudioPlayer, setAudioModeAsync, AudioPlayer, AudioSource } from 'expo-audio';
import { logger } from '../utils/logger';

const ADHAN_FILES: Record<string, AudioSource> = {
  default: require('../../assets/audio/adhan-default.mp3'),
};

const ADHAN_ATTRIBUTION = {
  title: 'Adhan in Qusser by the sea.mp3',
  author: 'AhmadAiuby',
  source: 'Freesound',
  license: 'CC0 1.0',
  soundId: 555065,
};

let currentSound: AudioPlayer | null = null;
let isLoaded = false;
let currentVolume = 1.0;

export function getAdhanAttribution() {
  return ADHAN_ATTRIBUTION;
}

export async function initAudio(): Promise<void> {
  if (isLoaded) return;
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'duckOthers',
  });
  isLoaded = true;
}

export function getAdhanVariants(): string[] {
  return Object.keys(ADHAN_FILES);
}

export async function setAdhanVolume(volume: number): Promise<void> {
  currentVolume = Math.max(0, Math.min(1, volume));
  if (currentSound) {
    currentSound.volume = currentVolume;
  }
}

export async function playAdhan(variant: string = 'default'): Promise<void> {
  try {
    await stopAdhan();

    const source = ADHAN_FILES[variant] || ADHAN_FILES.default;

    const player = createAudioPlayer(source);
    player.volume = currentVolume;
    player.loop = false;
    currentSound = player;

    player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        player.remove();
        if (currentSound === player) currentSound = null;
      }
    });
    player.play();
  } catch (error) {
    logger.warn('Failed to play adhan:', error);
    currentSound = null;
  }
}

export async function stopAdhan(): Promise<void> {
  try {
    if (currentSound) {
      currentSound.pause();
      currentSound.remove();
      currentSound = null;
    }
  } catch {}
}

export function isPlaying(): boolean {
  return currentSound !== null;
}
