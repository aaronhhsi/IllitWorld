import { yunah, minju, moka, wonhee, iroha } from '../assets/images/members';

// Photo card interface
export interface PhotoCard {
  id: string;
  name: string;
  color: string;
  unlockType: 'default' | 'video' | 'level' | 'purchase' | 'exclusive' | 'event';
  unlockRequirement: number | string; // Number for levels, string for video IDs
  imageUrl?: string; // Optional: URL to member photo for this card
}

export interface PhotoCardEra {
  era: string;
  cards: PhotoCard[];
}

export interface CharacterPhotoCards {
  [characterId: string]: PhotoCardEra[];
}

// Era configuration - maps filename prefix to display name and unlock behavior.
// To add a new era, add an entry here and in ERA_ORDER, then drop images with
// the matching prefix (e.g., "newera-1.jpg") into the member folders.
interface EraConfig {
  name: string;
  unlockType: PhotoCard['unlockType'];
  unlockRequirement: number | string;
}

const ERA_ORDER = ['run', 'srm', 'ily', 'bomb', 'tyt', 'nca', 'misc'];

const ERA_CONFIG: Record<string, EraConfig> = {
  run:  { name: 'R U Next?',         unlockType: 'default',  unlockRequirement: 0 },
  srm:  { name: 'Super Real Me',     unlockType: 'video',    unlockRequirement: 'magnetic-mv' },
  ily:  { name: "I'll Like You",     unlockType: 'video',    unlockRequirement: 'cherish-mv' },
  bomb: { name: 'Bomb',              unlockType: 'video',    unlockRequirement: 'do-the-dance' },
  tyt:  { name: 'Toki Yo Tomare',    unlockType: 'video',    unlockRequirement: 'toki-yo-tomare' },
  nca:  { name: 'Not Cute Anymore',  unlockType: 'video',    unlockRequirement: 'not-cute-anymore' },
  misc: { name: 'Misc.',             unlockType: 'purchase', unlockRequirement: 0 },
};

// Member colors used for card gradients
const MEMBER_COLORS: Record<string, string> = {
  yunah:  '#FF6B9D',
  minju:  '#C084FC',
  moka:   '#60A5FA',
  wonhee: '#34D399',
  iroha:  '#FBBF24',
};

// Per-member overrides when an era's unlock behavior differs from the default
const MEMBER_ERA_OVERRIDES: Record<string, Record<string, Partial<EraConfig>>> = {
  wonhee: {
    run:  { unlockType: 'video', unlockRequirement: 'aim-high' },
    misc: { unlockType: 'default', unlockRequirement: 0 },
  },
};

// Per-card overrides for special photocards.
// Use the card's full ID (e.g., 'yunah-srm-5') as the key. Any fields you
// specify here will override the auto-generated defaults for that card.
//
// Example:
//   'yunah-srm-5': { unlockType: 'level', unlockRequirement: 10, name: 'Limited Edition' },
//   'minju-srm-3': { unlockType: 'event', unlockRequirement: 'valentines-2025' },
const CARD_OVERRIDES: Record<string, Partial<PhotoCard>> = {
  // Add special card overrides here
};

// All member image records keyed by member ID
const MEMBER_IMAGES: Record<string, Record<string, any>> = {
  yunah,
  minju,
  moka,
  wonhee,
  iroha,
};

/**
 * Auto-generates photo card data from the images detected by require.context.
 *
 * Adding a new photo card only requires:
 *   1. Drop the image in assets/images/members/{member}/{era}-{number}.jpg
 *   2. Rebuild the app (Metro picks up new files automatically)
 *
 * To give a specific card special unlock requirements, add it to CARD_OVERRIDES above.
 *
 * Cards are grouped by era (in ERA_ORDER) and sorted by number within each era.
 */
function generatePhotoCardData(): CharacterPhotoCards {
  const result: CharacterPhotoCards = {};

  for (const [memberId, images] of Object.entries(MEMBER_IMAGES)) {
    // Parse image keys into era groups: 'yunah-srm-1' → era='srm', num=1
    const eraGroups: Record<string, { id: string; num: number }[]> = {};

    for (const key of Object.keys(images)) {
      const withoutMember = key.slice(memberId.length + 1); // e.g., 'srm-1'
      const lastDash = withoutMember.lastIndexOf('-');
      if (lastDash === -1) continue; // skip malformed keys

      const eraPrefix = withoutMember.substring(0, lastDash);
      const num = parseInt(withoutMember.substring(lastDash + 1), 10);
      if (isNaN(num)) continue; // skip malformed keys

      if (!eraGroups[eraPrefix]) eraGroups[eraPrefix] = [];
      eraGroups[eraPrefix].push({ id: key, num });
    }

    // Build PhotoCardEra entries in the configured order
    const eras: PhotoCardEra[] = [];

    // First, process known eras in order
    for (const eraPrefix of ERA_ORDER) {
      const group = eraGroups[eraPrefix];
      if (!group || group.length === 0) continue;

      group.sort((a, b) => a.num - b.num);

      const baseConfig = ERA_CONFIG[eraPrefix];
      const memberOverrides = MEMBER_ERA_OVERRIDES[memberId]?.[eraPrefix] || {};
      const config = { ...baseConfig, ...memberOverrides };

      eras.push({
        era: config.name,
        cards: group.map(({ id, num }) => ({
          id,
          name: `Photocard ${num}`,
          color: MEMBER_COLORS[memberId] || '#888',
          unlockType: config.unlockType,
          unlockRequirement: config.unlockRequirement,
          ...CARD_OVERRIDES[id],
        })),
      });
    }

    // Then, append any unknown era prefixes (future-proofing)
    for (const [eraPrefix, group] of Object.entries(eraGroups)) {
      if (ERA_ORDER.includes(eraPrefix)) continue;

      group.sort((a, b) => a.num - b.num);

      eras.push({
        era: eraPrefix.toUpperCase(),
        cards: group.map(({ id, num }) => ({
          id,
          name: `Photocard ${num}`,
          color: MEMBER_COLORS[memberId] || '#888',
          unlockType: 'default' as const,
          unlockRequirement: 0,
          ...CARD_OVERRIDES[id],
        })),
      });
    }

    result[memberId] = eras;
  }

  return result;
}

// Photo card data - auto-generated from images at module load time
export const photoCardData: CharacterPhotoCards = generatePhotoCardData();
