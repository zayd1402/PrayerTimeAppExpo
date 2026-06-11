import { Audio, AVPlaybackSource } from 'expo-av';

const ADHAN_FILES: Record<string, AVPlaybackSource> = {
  default: require('../../assets/audio/adhan-default.mp3'),
};

const ADHAN_ATTRIBUTION = {
  title: 'Adhan in Qusser by the sea.mp3',
  author: 'AhmadAiuby',
  source: 'Freesound',
  license: 'CC0 1.0',
  soundId: 555065,
};

let currentSound: Audio.Sound | null = null;
let isLoaded = false;
let currentVolume = 1.0;

export function getAdhanAttribution() {
  return ADHAN_ATTRIBUTION;
}

export async function initAudio(): Promise<void> {
  if (isLoaded) return;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
  });
  isLoaded = true;
}

export function getAdhanVariants(): string[] {
  return Object.keys(ADHAN_FILES);
}

export async function setAdhanVolume(volume: number): Promise<void> {
  currentVolume = Math.max(0, Math.min(1, volume));
  if (currentSound) {
    await currentSound.setVolumeAsync(currentVolume);
  }
}

export async function playAdhan(variant: string = 'default'): Promise<void> {
  try {
    await stopAdhan();

    const source = ADHAN_FILES[variant] || ADHAN_FILES.default;

    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: true,
      volume: currentVolume,
      isLooping: false,
    });
    currentSound = sound;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
        currentSound = null;
      }
    });
  } catch (error) {
    if (__DEV__) console.warn('Failed to play adhan:', error);
    currentSound = null;
  }
}

export async function stopAdhan(): Promise<void> {
  try {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }
  } catch {}
}

export function isPlaying(): boolean {
  return currentSound !== null;
}
