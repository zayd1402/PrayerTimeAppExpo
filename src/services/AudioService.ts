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

/*
 * To add adhan audio, call setAdhanFile() at app startup:
 *
 * import { setAdhanFile } from './services/AudioService';
 * setAdhanFile('makkah', require('../assets/audio/adhan-makkah.mp3'));
 * setAdhanFile('madinah', require('../assets/audio/adhan-madinah.mp3'));
 * setAdhanFile('egyptian', require('../assets/audio/adhan-egyptian.mp3'));
 * setAdhanFile('default', require('../assets/audio/adhan-makkah.mp3'));
 *
 * Place the MP3 files in assets/audio/ before building.
 * Free adhan downloads: https://download.quranicaudio.com/qadha/
 */

export async function playAdhan(variant: string = 'default'): Promise<void> {
  try {
    await stopAdhan();

    const source = ADHAN_FILES[variant] || ADHAN_FILES.default;
    if (!source) {
      if (__DEV__) console.log('No adhan audio file for variant:', variant);
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
