// Video data structure
export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  xpReward: number; // Deprecated: use duration-based XP instead
  duration: number; // Video duration in seconds
  category: 'Music Video' | 'Dance Practice' | 'SUPER ILLIT' | 'Misc';
  characterSpecific?: string[]; // Future: for character-specific videos
}

// Import game config for XP values
const GAME_CONFIG = {
  XP_PER_VIDEO: 50,
};

export const videos: Video[] = [
  // Super Real Me Era
  {
    id: 'magnetic-mv',
    youtubeId: 'Vk5-c_v4gMU',
    title: 'ILLIT - Magnetic (MV)',
    description: 'Unlocks Super Real Me photo cards!',
    xpReward: GAME_CONFIG.XP_PER_VIDEO,
    duration: 180, // 3:00
    category: 'Music Video',
  },
  {
    id: 'lucky-girl-syndrome',
    youtubeId: 'UCmgGZbfjmk',
    title: 'ILLIT - Lucky Girl Syndrome (MV)',
    description: 'Unlocks Super Real Me photo cards!',
    xpReward: GAME_CONFIG.XP_PER_VIDEO,
    duration: 164, // 2:44
    category: 'Music Video',
  },
  // I'll Like You Era
  {
    id: 'cherish-mv',
    youtubeId: 'tbDGl7jEazA',
    title: "ILLIT - Cherish (My Love) (MV)",
    description: "Unlocks I'll Like You photo cards!",
    xpReward: GAME_CONFIG.XP_PER_VIDEO,
    duration: 179, // 2:59
    category: 'Music Video',
  },
  // Bomb Era
  {
    id: 'tick-tack-mv',
    youtubeId: '-nEGVrzPaiU',
    title: 'ILLIT - Tick-Tack (MV)',
    description: 'Unlocks Bomb era photo cards!',
    xpReward: GAME_CONFIG.XP_PER_VIDEO,
    duration: 182, // 3:02
    category: 'Music Video',
  },
  // I'll Like You Era
  {
    id: 'little-monster',
    youtubeId: 'xRU1XXHIpIc',
    title: 'ILLIT - little monster (MV)',
    description: "Unlocks I'll Like You photo cards!",
    xpReward: GAME_CONFIG.XP_PER_VIDEO,
    duration: 147, // 2:27
    category: 'Music Video',
  },
  // Not Cute Anymore Era
  {
    id: 'do-the-dance',
    youtubeId: 'negtrQu5mTA',
    title: 'ILLIT - Do the Dance (MV)',
    description: 'Unlocks Not Cute Anymore photo cards!',
    xpReward: GAME_CONFIG.XP_PER_VIDEO,
    duration: 174, // 2:54
    category: 'Music Video',
  },
  // Other/Bonus
  {
    id: 'jellyous',
    youtubeId: 'GkG60kISnfc',
    title: 'ILLIT - Jellyous (MV)',
    description: 'Watch to earn XP for all characters!',
    xpReward: GAME_CONFIG.XP_PER_VIDEO,
    duration: 153, // 2:33
    category: 'Music Video',
  },
  // Toki Yo Tomare Era
  {
    id: 'toki-yo-tomare',
    youtubeId: 'HeqsjDF7Lw0',
    title: 'ILLIT - Toki Yo Tomare (MV)',
    description: 'Unlocks Toki Yo Tomare photo cards!',
    xpReward: GAME_CONFIG.XP_PER_VIDEO,
    duration: 170, // 2:50
    category: 'Music Video',
  },
  // Not Cute Anymore Era
  {
    id: 'not-cute-anymore',
    youtubeId: 'x_RYZsOfpKY',
    title: 'ILLIT - NOT CUTE ANYMORE (MV)',
    description: 'Unlocks Not Cute Anymore photo cards!',
    xpReward: GAME_CONFIG.XP_PER_VIDEO,
    duration: 161, // 2:41
    category: 'Music Video',
  },
  {
    id: 'sunday-morning',
    youtubeId: '-01oDwXKSuE',
    title: 'ILLIT - Sunday Morning (MV)',
    description: 'Unlocks Not Cute Anymore photo cards!',
    xpReward: GAME_CONFIG.XP_PER_VIDEO,
    duration: 168, // 2:48
    category: 'Music Video',
  },
  {
    id: 'not-me',
    youtubeId: '9nEp9eeGaJk',
    title: 'ILLIT - NOT ME (MV)',
    description: 'Unlocks Not Cute Anymore photo cards!',
    xpReward: GAME_CONFIG.XP_PER_VIDEO,
    duration: 156, // 2:36
    category: 'Music Video',
  },
  // R U Next? Era
  {
    id: 'aim-high',
    youtubeId: '4p3Yy-HiMUE',
    title: 'ILLIT - Aim High',
    description: 'Unlocks R U Next? profile pictures!',
    xpReward: GAME_CONFIG.XP_PER_VIDEO,
    duration: 180, // Approximate duration
    category: 'Misc',
  },
];
