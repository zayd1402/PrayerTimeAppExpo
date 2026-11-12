// In Expo Go there is no MMKV, so the store keeps data in memory and saves it to AsyncStorage.
// Shared across isolated module loads, like the phone's disk across launches.
const mockDisk = new Map<string, string>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: async (k: string, v: string) => { mockDisk.set(k, v); },
    removeItem: async (k: string) => { mockDisk.delete(k); },
    getAllKeys: async () => [...mockDisk.keys()],
    multiGet: async (keys: string[]) => keys.map(k => [k, mockDisk.get(k) ?? null]),
  },
}));

function loadInExpoGo() {
  let mod: typeof import('../kvStore') | undefined;
  jest.isolateModules(() => {
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { executionEnvironment: 'storeClient' },
      ExecutionEnvironment: { StoreClient: 'storeClient' },
    }));
    mod = require('../kvStore');
  });
  return mod!;
}

describe('kvStore in Expo Go', () => {
  it('keeps values across a relaunch through AsyncStorage', async () => {
    const first = loadInExpoGo();
    await first.hydrateStorage();
    first.kv.set('@prayertime:settings', '{"a":1}');
    first.kv.set('@prayertime:hadith_index', 7);
    await new Promise(r => setTimeout(r, 0));

    const relaunched = loadInExpoGo();
    expect(relaunched.kv.getString('@prayertime:settings')).toBeUndefined();
    await relaunched.hydrateStorage();
    expect(relaunched.kv.getString('@prayertime:settings')).toBe('{"a":1}');
    expect(relaunched.kv.getNumber('@prayertime:hadith_index')).toBe(7);

    relaunched.kv.remove('@prayertime:settings');
    await new Promise(r => setTimeout(r, 0));
    const again = loadInExpoGo();
    await again.hydrateStorage();
    expect(again.kv.getString('@prayertime:settings')).toBeUndefined();
  });
});
