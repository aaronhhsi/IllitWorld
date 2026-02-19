import { supabase } from '../config/supabase';

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
  watchedVideos: Record<string, number>; // Map of video ID -> timestamp when completed
  favoriteVideos?: Record<string, boolean>;
  selectedBackground?: string;
  lastUpdated: number;
}

// Save user's game data to Supabase (upsert — insert or update)
export const saveGameData = async (userId: string, gameData: UserGameData): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_game_data')
      .upsert({
        user_id: userId,
        characters: gameData.characters,
        show_photos: gameData.showPhotos,
        watched_videos: gameData.watchedVideos,
        favorite_videos: gameData.favoriteVideos ?? {},
        selected_background: gameData.selectedBackground ?? 'japanese-classroom',
        last_updated: Date.now(),
      }, { onConflict: 'user_id' });
    if (error) throw error;
    console.log('Game data saved successfully');
  } catch (error) {
    console.error('Error saving game data:', error);
    throw error;
  }
};

// Load user's game data from Supabase
export const loadGameData = async (userId: string): Promise<UserGameData | null> => {
  try {
    const { data, error } = await supabase
      .from('user_game_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // PGRST116 = no rows found (new user)
      if (error.code === 'PGRST116') {
        console.log('No saved game data found');
        return null;
      }
      throw error;
    }

    console.log('Game data loaded successfully');
    return {
      characters: data.characters,
      showPhotos: data.show_photos,
      watchedVideos: data.watched_videos,
      favoriteVideos: data.favorite_videos,
      selectedBackground: data.selected_background,
      lastUpdated: data.last_updated,
    };
  } catch (error) {
    console.error('Error loading game data:', error);
    throw error;
  }
};
