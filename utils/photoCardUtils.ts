import { PhotoCard } from '../data/photoCards';
import { videos } from '../data/videos';

export const isPhotoCardUnlocked = (
  photoCard: PhotoCard,
  characterLevel: number,
  watchedVideos: Record<string, number>
): boolean => {
  switch (photoCard.unlockType) {
    case 'default':
      return true;
    case 'video':
      return !!watchedVideos[photoCard.unlockRequirement as string];
    case 'level':
      return characterLevel >= (photoCard.unlockRequirement as number);
    case 'purchase':
    case 'exclusive':
    case 'event':
      return false;
    default:
      return false;
  }
};

export const getUnlockText = (photoCard: PhotoCard): string => {
  switch (photoCard.unlockType) {
    case 'video': {
      const video = videos.find(v => v.id === photoCard.unlockRequirement);
      return video ? `Watch: ${video.title}` : 'Watch a video to unlock';
    }
    case 'level':
      return `Unlock at Level ${photoCard.unlockRequirement}`;
    case 'purchase':
      return 'Available for Purchase';
    case 'exclusive':
      return 'Exclusive Reward';
    case 'event':
      return 'Limited Event Reward';
    default:
      return 'Locked';
  }
};
