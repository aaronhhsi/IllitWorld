import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Character {
  id: string;
  name: string;
  level: number;
  xp: number;
  color: string;
  selectedPhotoCard: string;
}

export interface UserGameData {
  characters: Character[];
  showPhotos: boolean;
  watchedVideos: Record<string, number>; // Map of video ID -> timestamp when completed (0 = not watched)
  favoriteVideos?: Record<string, boolean>;
  selectedBackground?: string;
  lastUpdated: number;
}

// Save user's character data to Firestore
export const saveGameData = async (userId: string, gameData: UserGameData): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, {
      ...gameData,
      lastUpdated: Date.now(),
    });
    console.log('Game data saved successfully');
  } catch (error) {
    console.error('Error saving game data:', error);
    throw error;
  }
};

// Load user's character data from Firestore
export const loadGameData = async (userId: string): Promise<UserGameData | null> => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      console.log('Game data loaded successfully');
      return docSnap.data() as UserGameData;
    } else {
      console.log('No saved game data found');
      return null;
    }
  } catch (error) {
    console.error('Error loading game data:', error);
    throw error;
  }
};
