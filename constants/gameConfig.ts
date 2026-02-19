export const NUM_CARDS = 5;
export const SPACING_RATIO = 0.1;

export const GAME_CONFIG = {
  XP_PER_VIDEO: 50,
  XP_PER_LEVEL: 200,
};

export interface Character {
  id: string;
  name: string;
  level: number;
  xp: number;
  color: string;
  selectedPhotoCard: string;
}

export const initialCharacters: Character[] = [
  { id: 'yunah', name: 'Yunah', level: 1, xp: 0, color: '#FF6B9D', selectedPhotoCard: 'yunah-misc-1' },
  { id: 'minju', name: 'Minju', level: 1, xp: 0, color: '#C084FC', selectedPhotoCard: 'minju-misc-1' },
  { id: 'moka', name: 'Moka', level: 1, xp: 0, color: '#60A5FA', selectedPhotoCard: 'moka-misc-1' },
  { id: 'wonhee', name: 'Wonhee', level: 1, xp: 0, color: '#34D399', selectedPhotoCard: 'wonhee-misc-1' },
  { id: 'iroha', name: 'Iroha', level: 1, xp: 0, color: '#FBBF24', selectedPhotoCard: 'iroha-misc-1' },
];

export const BACKGROUNDS: { id: string; name: string; source: any }[] = [
  { id: 'japanese-classroom', name: 'Japanese Classroom', source: require('../assets/images/japaneseclassroomcreduJamoues.webp') },
];

export const calculateCardDimensions = (screenWidth: number) => {
  let sideMargin = 20;
  if (screenWidth > 1024) {
    const maxCardWidth = 180;
    const maxTotalCardWidth = (maxCardWidth * NUM_CARDS) + (maxCardWidth * SPACING_RATIO * (NUM_CARDS - 1));
    if (screenWidth > maxTotalCardWidth + 100) {
      sideMargin = Math.max(100, (screenWidth - maxTotalCardWidth) * 0.3);
    } else {
      sideMargin = 60;
    }
  } else if (screenWidth > 768) {
    sideMargin = 40;
  }

  const availableWidth = screenWidth - sideMargin;
  const cardWidth = availableWidth / (NUM_CARDS + (NUM_CARDS - 1) * SPACING_RATIO);
  const finalCardWidth = Math.min(Math.max(cardWidth, 50), 180);
  const finalCardHeight = (finalCardWidth / 180) * 240;
  return { width: finalCardWidth, height: finalCardHeight, margin: sideMargin };
};
