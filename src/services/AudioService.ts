import { Audio, AVPlaybackSource } from 'expo-av';

const ADHAN_FILES: Record<string, AVPlaybackSource | null> = {
  makkah: null,
  madinah: null,
  egyptian: null,
  default: null,
};

let currentSound: Audio.Sound | null = null;
let isLoaded = false;

export async function initAudio(): Promise<void> {
  if (isLoaded) return;
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: true,
    shouldDuckAndroid: true,
  });
  isLoaded = true;
}

export function setAdhanFile(variant: string, source: AVPlaybackSource): void {
  ADHAN_FILES[variant] = source;
}

export async function playAdhan(variant: string = 'default'): Promise<void> {
  try {
    await stopAdhan();

    const source = ADHAN_FILES[variant] || ADHAN_FILES.default;
    if (!source) {
      console.log('No adhan audio file for variant:', variant);
      return;
    }

    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: true,
      volume: 1.0,
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
    console.warn('Failed to play adhan:', error);
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
