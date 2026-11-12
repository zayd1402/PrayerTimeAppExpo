// Key-value store behind StorageService. Uses MMKV in real builds. Expo Go doesn't ship MMKV
// (it is a Nitro module), so there the app falls back to an in-memory copy that is loaded from
// AsyncStorage at launch and written back to it on every change. Same synchronous API either way.
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';

export interface KVStore {
  getString(key: string): string | undefined;
  getNumber(key: string): number | undefined;
  set(key: string, value: string | number | boolean): void;
  remove(key: string): boolean;
}

const PREFIX = 'prayertime-storage:';

function createMemoryStore(): { store: KVStore; hydrate: () => Promise<void> } {
  const data = new Map<string, string>();
  const persist = (key: string, value: string | null) => {
    const op = value === null ? AsyncStorage.removeItem(PREFIX + key) : AsyncStorage.setItem(PREFIX + key, value);
    op.catch(() => {});
  };
  const store: KVStore = {
    getString: key => data.get(key),
    getNumber: key => {
      const raw = data.get(key);
      if (raw === undefined) return undefined;
      const n = Number(raw);
      return Number.isNaN(n) ? undefined : n;
    },
    set: (key, value) => {
      const raw = String(value);
      data.set(key, raw);
      persist(key, raw);
    },
    remove: key => {
      const had = data.delete(key);
      persist(key, null);
      return had;
    },
  };
  const hydrate = async () => {
    try {
      const keys = (await AsyncStorage.getAllKeys()).filter(k => k.startsWith(PREFIX));
      const pairs = await AsyncStorage.multiGet(keys);
      for (const [k, v] of pairs) {
        // Don't overwrite anything written while loading.
        const key = k.slice(PREFIX.length);
        if (v !== null && !data.has(key)) data.set(key, v);
      }
    } catch {
      // Start empty rather than block launch.
    }
  };
  return { store, hydrate };
}

function createStore(): { store: KVStore; hydrate: () => Promise<void> } {
  const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (!inExpoGo) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
      const mmkv = createMMKV({ id: 'prayertime-storage' });
      return { store: mmkv, hydrate: () => Promise.resolve() };
    } catch {
      // Native module missing (an older dev build, for example). Fall through to AsyncStorage.
    }
  }
  return createMemoryStore();
}

const created = createStore();

export const kv: KVStore = created.store;

/** Resolves once stored data is readable. Call before the first screen renders. */
export const hydrateStorage: () => Promise<void> = created.hydrate;
