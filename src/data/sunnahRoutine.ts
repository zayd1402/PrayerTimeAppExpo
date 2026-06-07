export interface SunnahItem {
  id: string;
  category: 'morning' | 'evening' | 'night';
  title: string;
  arabic: string;
  transliteration?: string;
  count: number;
  source?: string;
  order: number;
}

export const SUNNAH_ROUTINE: SunnahItem[] = [
  // ── Morning (Athkar al-Sabah) ──────────────────────────────
  {
    id: 'wake-up', category: 'morning',
    title: 'Wake-up Dua',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
    transliteration: 'Alhamdulillahilladhi ahyana ba\'da ma amatana wa ilayhin-nushur',
    count: 1, source: 'Bukhari', order: 1,
  },
  {
    id: 'ayat-kursi', category: 'morning',
    title: 'Ayat al-Kursi',
    arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...',
    count: 1, source: 'Quran 2:255', order: 2,
  },
  {
    id: 'surah-ikhlas', category: 'morning',
    title: 'Surah al-Ikhlas',
    arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
    count: 3, order: 3,
  },
  {
    id: 'surah-falaq', category: 'morning',
    title: 'Surah al-Falaq',
    arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ',
    count: 3, order: 4,
  },
  {
    id: 'surah-nas', category: 'morning',
    title: 'Surah an-Nas',
    arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
    count: 3, order: 5,
  },
  {
    id: 'morning-istighfar', category: 'morning',
    title: 'Morning Istighfar',
    arabic: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    transliteration: 'Astaghfirullah wa atubu ilayh',
    count: 3, order: 6,
  },
  {
    id: 'morning-tasbih', category: 'morning',
    title: 'Morning Tasbih',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: 'Subhanallah wa bihamdih',
    count: 100, order: 7,
  },
  {
    id: 'morning-dua-protection', category: 'morning',
    title: 'Morning Protection Dua',
    arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    transliteration: 'Bismillahilladhi la yadurru ma\'asmihi shay\'un fil-ardi wa la fis-sama\'i wa huwas-sami\'ul-\'alim',
    count: 3, order: 8,
  },

  // ── Evening (Athkar al-Masa) ──────────────────────────────
  {
    id: 'evening-istighfar', category: 'evening',
    title: 'Evening Istighfar',
    arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ الْحَيَّ الْقَيُّومَ وَأَتُوبُ إِلَيْهِ',
    count: 3, source: 'Abu Dawud', order: 1,
  },
  {
    id: 'evening-tasbih', category: 'evening',
    title: 'Evening Tasbih',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: 'Subhanallah wa bihamdih',
    count: 100, order: 2,
  },
  {
    id: 'evening-ayat-kursi', category: 'evening',
    title: 'Ayat al-Kursi (Evening)',
    arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...',
    count: 1, order: 3,
  },
  {
    id: 'evening-quls', category: 'evening',
    title: 'The 3 Quls (Evening)',
    arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ • قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ • قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
    count: 3, order: 4,
  },
  {
    id: 'evening-protection', category: 'evening',
    title: 'Evening Protection',
    arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ',
    transliteration: 'Amsayna wa amsal-mulku lillah wal-hamdu lillah',
    count: 1, order: 5,
  },

  // ── Night (Before Sleep) ──────────────────────────────────
  {
    id: 'surah-mulk', category: 'night',
    title: 'Surah al-Mulk',
    arabic: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ',
    count: 1, source: 'Tirmidhi — protects from grave torment', order: 1,
  },
  {
    id: 'surah-sajdah', category: 'night',
    title: 'Surah as-Sajdah',
    arabic: 'الٓمٓ ۚ تَنزِيلُ الْكِتَابِ لَا رَيْبَ فِيهِ',
    count: 1, order: 2,
  },
  {
    id: 'sleep-dua', category: 'night',
    title: 'Sleep Dua',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    transliteration: 'Bismikallahumma amutu wa ahya',
    count: 1, order: 3,
  },
  {
    id: 'ayat-kursi-night', category: 'night',
    title: 'Ayat al-Kursi (Before Sleep)',
    arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...',
    count: 1, source: 'Whoever recites it before sleep, Allah appoints a guardian over them', order: 4,
  },
  {
    id: 'last-two-ayahs-baqarah', category: 'night',
    title: 'Last 2 Ayahs of al-Baqarah',
    arabic: 'آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ...',
    count: 1, source: 'Bukhari — sufficient for the night', order: 5,
  },
  {
    id: 'sleep-tasbih', category: 'night',
    title: 'Sleep Tasbih',
    arabic: 'سُبْحَانَ اللَّهِ (33×) • الْحَمْدُ لِلَّهِ (33×) • اللَّهُ أَكْبَرُ (34×)',
    count: 100, order: 6,
  },
];
