// Route names for the root stack. Tabs live under 'tabs'; everything else is a sub-page with a back button.
export type RootStackParamList = {
  tabs: undefined;
  settings: undefined;
  duas: undefined;
  hadith: undefined;
  sunnah: undefined;
  weekly: undefined;
  friday: undefined;
  ramadan: undefined;
  hajj: undefined;
  calendar: undefined;
  hifdh: undefined;
  zakat: undefined;
  journal: undefined;
  tazkiyah: undefined;
  mosques: undefined;
  worship: { tab?: 'prayers' | 'dhikr' | 'quran' | 'fasting' } | undefined;
};

export type SubPage = Exclude<keyof RootStackParamList, 'tabs'>;
