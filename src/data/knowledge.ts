export interface KnowledgeLesson {
  id: string;
  topic: 'aqeedah' | 'fiqh' | 'seerah' | 'names_of_allah' | 'tafsir' | 'adab';
  title: string;
  content: string;
  source?: string;
  lessonNumber: number;
}

const ALL_LESSONS: KnowledgeLesson[] = [
  {
    id: 'aqeedah-1', topic: 'aqeedah',
    title: 'The First Obligation',
    content: 'The first obligation upon every Muslim is to know Allah — His existence, His oneness, and His right to be worshipped alone. This is the foundation of faith (tawhid). Everything else in Islam builds upon this single truth: la ilaha illallah.',
    source: 'Quran 47:19',
    lessonNumber: 1,
  },
  {
    id: 'aqeedah-2', topic: 'aqeedah',
    title: 'The Two Testimonies',
    content: 'The shahadah has two parts. "La ilaha illallah" means none has the right to be worshipped except Allah. "Muhammadur Rasulullah" means Muhammad is the final messenger — we follow him in all aspects of life. Accepting one without the other is incomplete.',
    source: 'Bukhari, Muslim',
    lessonNumber: 2,
  },
  {
    id: 'seerah-1', topic: 'seerah',
    title: 'The Year of the Elephant',
    content: 'In the year of the Prophet\'s birth, Abraha marched from Yemen with elephants to destroy the Ka\'bah. Allah sent flocks of birds carrying stones of baked clay, destroying the army. This event preserved the sanctity of the House of Allah and foreshadowed the coming of His final messenger.',
    source: 'Quran 105:1-5',
    lessonNumber: 3,
  },
  {
    id: 'seerah-2', topic: 'seerah',
    title: 'The First Revelation',
    content: 'At age 40, while meditating in the Cave of Hira, Angel Jibril appeared and commanded: "Read!" The Prophet replied, "I am not a reader." Jibril squeezed him and repeated the command three times, then revealed the first five verses of Surah al-Alaq. This began 23 years of revelation.',
    source: 'Bukhari',
    lessonNumber: 4,
  },
  {
    id: 'names-1', topic: 'names_of_allah',
    title: 'Ar-Rahman (The Most Merciful)',
    content: 'Ar-Rahman is a name exclusive to Allah, denoting the vastest form of mercy that encompasses all of creation — believer and disbeliever, human and animal. Every breath, every provision, every moment of life is a manifestation of Ar-Rahman. This mercy is not earned; it is given.',
    source: 'Quran 1:1',
    lessonNumber: 5,
  },
  {
    id: 'names-2', topic: 'names_of_allah',
    title: 'Al-Hakim (The All-Wise)',
    content: 'Allah\'s actions and commands are all based on perfect wisdom. Even when we do not understand the wisdom behind a trial or a ruling, we trust that Al-Hakim has placed everything precisely where it belongs. Nothing is random. Nothing is wasted.',
    source: 'Quran 31:27',
    lessonNumber: 6,
  },
  {
    id: 'fiqh-1', topic: 'fiqh',
    title: 'Conditions of Prayer',
    content: 'For prayer to be valid, five conditions must be met: (1) entering the time of prayer, (2) covering the awrah, (3) being in a state of purity (wudu or ghusl), (4) facing the qiblah, and (5) having the intention. Missing any one invalidates the prayer.',
    lessonNumber: 7,
  },
  {
    id: 'fiqh-2', topic: 'fiqh',
    title: 'The Pillars of Prayer',
    content: 'Prayer has 14 pillars (arkan). If any is omitted, the prayer is invalid. These include: standing if able, saying Allahu Akbar to begin, reciting al-Fatihah, bowing (ruku), rising from bowing, prostrating (sujud), rising from sujud, sitting between prostrations, final tashahhud, and the final salam.',
    lessonNumber: 8,
  },
  {
    id: 'tafsir-1', topic: 'tafsir',
    title: 'Surah al-Fatihah — The Opening',
    content: 'Al-Fatihah is the greatest surah of the Quran. Every verse is a dua between the servant and Allah. When we say "Alhamdulillahi Rabbil Alamin," Allah responds "My servant has praised Me." When we say "Ihdinas Siratal Mustaqim," Allah says "This is for My servant." Each verse is a divine conversation.',
    source: 'Muslim',
    lessonNumber: 9,
  },
  {
    id: 'tafsir-2', topic: 'tafsir',
    title: 'Ayat al-Kursi — The Throne Verse',
    content: 'Ayat al-Kursi (2:255) is the greatest verse in the Quran. It describes Allah\'s absolute sovereignty: He lives eternally, never sleeps, owns all in the heavens and earth, and His Kursi (footstool) encompasses the entire universe. Reciting it after every prayer ensures entry into Paradise.',
    source: 'Quran 2:255, Nasai',
    lessonNumber: 10,
  },
  {
    id: 'adab-1', topic: 'adab',
    title: 'The Greeting of Peace',
    content: 'The Prophet ﷺ commanded us to spread salam (peace) as a means of strengthening bonds between believers. The one who initiates the greeting earns the most reward. Responding with "wa alaykum us-salaam wa rahmatullahi wa barakatuh" is better than just returning the same words.',
    source: 'Muslim, Abu Dawud',
    lessonNumber: 11,
  },
  {
    id: 'adab-2', topic: 'adab',
    title: 'The Etiquette of Sneezing',
    content: 'When you sneeze, say "Alhamdulillah" (praise be to Allah). The person who hears should respond "Yarhamukallah" (may Allah have mercy on you). The sneezer then replies "Yahdikumullah wa yuslihu balakum" (may Allah guide you and set your affairs right). This is a prophetic tradition.',
    source: 'Bukhari',
    lessonNumber: 12,
  },
  {
    id: 'aqeedah-3', topic: 'aqeedah',
    title: 'The Six Pillars of Faith',
    content: 'Iman (faith) consists of six pillars: belief in Allah, His angels, His books, His messengers, the Last Day, and divine decree (qadr) — both the good and the difficult. Each pillar is interconnected. Weakness in one affects the strength of the others.',
    source: 'Muslim (Hadith of Jibril)',
    lessonNumber: 13,
  },
  {
    id: 'seerah-3', topic: 'seerah',
    title: 'The Night Journey (Isra wal-Mi\'raj)',
    content: 'In one night, the Prophet ﷺ was taken from Makkah to Jerusalem, then ascended through the seven heavens. He met Adam, Musa, Isa, and other prophets, and was given the obligation of fifty daily prayers — reduced to five at Musa\'s suggestion. This journey is a miracle and a source of immense comfort.',
    source: 'Bukhari, Muslim',
    lessonNumber: 14,
  },
  {
    id: 'names-3', topic: 'names_of_allah',
    title: 'As-Sabur (The Patient)',
    content: 'Allah is As-Sabur — He does not hasten punishment. Despite our continuous sins and shortcomings, He gives us time to repent, time to return, time to change. His patience is not weakness but mercy. The moment we turn back, He is there, waiting with open forgiveness.',
    lessonNumber: 15,
  },
  {
    id: 'fiqh-3', topic: 'fiqh',
    title: 'What Breaks Wudu',
    content: 'Wudu is nullified by: (1) anything exiting from the private parts, (2) falling asleep while reclining, (3) loss of consciousness, (4) touching the private parts directly, (5) eating camel meat. Bleeding from a wound or cupping does not break wudu in the strongest opinion.',
    source: 'Abu Dawud, Tirmidhi',
    lessonNumber: 16,
  },
  {
    id: 'tafsir-3', topic: 'tafsir',
    title: 'Surah al-Ikhlas — Pure Monotheism',
    content: 'This surah is equal to one-third of the Quran. It summarizes tawhid in four verses: Allah is One (Ahad), Eternal (Samad), He does not beget nor is He begotten, and none is comparable to Him. The Prophet ﷺ said that loving this surah guarantees Paradise.',
    source: 'Bukhari, Tirmidhi',
    lessonNumber: 17,
  },
  {
    id: 'adab-3', topic: 'adab',
    title: 'The Rights of Neighbors',
    content: 'The Prophet ﷺ said: "Jibril kept advising me about the neighbor until I thought he would make him an heir." (Bukhari, Muslim). Islamic etiquette requires sharing food with neighbors, not harming them, visiting them when sick, and forgiving their mistakes. The neighbor\'s rights apply regardless of their religion.',
    lessonNumber: 18,
  },
];

export function getLessonForDate(date: Date = new Date()): KnowledgeLesson {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
  const index = dayOfYear % ALL_LESSONS.length;
  return ALL_LESSONS[index];
}

export function getAllLessons(): KnowledgeLesson[] {
  return ALL_LESSONS;
}
