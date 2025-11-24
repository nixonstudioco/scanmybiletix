/**
 * Sound Service - Handles playing audio feedback for the application
 */

// Sound URLs - using better sounds for clear validation feedback
const SOUNDS = {
  SUCCESS: 'https://assets.mixkit.co/active_storage/sfx/213/213-preview.mp3', // Clear "check" sound
  ERROR: 'https://assets.mixkit.co/active_storage/sfx/178/178-preview.mp3',   // Horn-like rejection sound
  SCAN: 'https://assets.mixkit.co/active_storage/sfx/1234/1234-preview.mp3'   // Keep the scanning sound
};

// Cache audio instances
const audioCache: Record<string, HTMLAudioElement> = {};

/**
 * Preload all sounds for better performance
 */
export const preloadSounds = (): void => {
  Object.entries(SOUNDS).forEach(([key, url]) => {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audioCache[key] = audio;
    
    // Load the audio file
    audio.load();
  });
};

/**
 * Play a sound effect
 * @param soundType The type of sound to play
 * @param volume Optional volume (0.0 to 1.0)
 */
export const playSound = (
  soundType: 'SUCCESS' | 'ERROR' | 'SCAN',
  volume: number = 0.7
): void => {
  try {
    let audio: HTMLAudioElement;
    
    // Get from cache or create new
    if (audioCache[soundType]) {
      audio = audioCache[soundType];
      // Reset the audio to start from beginning if it's already playing
      audio.currentTime = 0;
    } else {
      audio = new Audio(SOUNDS[soundType]);
      audioCache[soundType] = audio;
    }
    
    // Set volume
    audio.volume = volume;
    
    // Play the sound
    audio.play().catch(error => {
      // Handle autoplay restrictions gracefully
      console.warn(`Could not play sound (${soundType}):`, error);
    });
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

// Preload sounds when this module is imported
preloadSounds();

export default {
  playSound,
  preloadSounds
};