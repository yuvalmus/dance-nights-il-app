import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Constants for chunking logic
const CHUNK_SIZE = 2000; // Safely under the 2048 limit
const CHUNK_COUNT_KEY_SUFFIX = '_chunk_count';

const LargeSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // 1. Check if this key was stored in chunks
      const countString = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_KEY_SUFFIX}`);
      
      if (countString) {
        const count = parseInt(countString, 10);
        let combinedValue = '';
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
          if (chunk) combinedValue += chunk;
        }
        return combinedValue;
      }

      // 2. Fallback for single-item storage (legacy or small items)
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (value.length > CHUNK_SIZE) {
        const chunks = Math.ceil(value.length / CHUNK_SIZE);
        
        // Store the number of chunks first
        await SecureStore.setItemAsync(`${key}${CHUNK_COUNT_KEY_SUFFIX}`, chunks.toString());
        
        // Store each chunk separately
        for (let i = 0; i < chunks; i++) {
          const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunk);
        }
        
        // Clear the base key in case it was used previously
        await SecureStore.deleteItemAsync(key);
      } else {
        // If the value is small, store it normally and clear any old chunks
        await LargeSecureStoreAdapter.removeItem(key); 
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('SecureStore Error:', error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    // Check if chunks exist and delete them
    const countString = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_KEY_SUFFIX}`);
    if (countString) {
      const count = parseInt(countString, 10);
      for (let i = 0; i < count; i++) {
        await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
      }
      await SecureStore.deleteItemAsync(`${key}${CHUNK_COUNT_KEY_SUFFIX}`);
    }
    // Delete the base key
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: LargeSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});