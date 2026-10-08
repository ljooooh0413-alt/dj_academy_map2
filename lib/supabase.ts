import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FavoriteItem, Academy } from '@/types/academy';

const LOCAL_STORAGE_KEY = 'edumap_favorites_local';
const SUPABASE_CONFIG_KEY = 'edumap_custom_supabase_config';

// Retrieve Supabase URL & Key with priority: Custom localStorage override -> env variables
export function getSupabaseCredentials(): { url: string; anonKey: string } {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SUPABASE_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.url && parsed.anonKey) {
          return { url: parsed.url, anonKey: parsed.anonKey };
        }
      }
    } catch {
      // ignore
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return { url, anonKey };
}

export function saveCustomSupabaseCredentials(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    if (url && anonKey) {
      localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url, anonKey }));
    } else {
      localStorage.removeItem(SUPABASE_CONFIG_KEY);
    }
  }
}

let supabaseInstance: SupabaseClient | null = null;
let lastCredsHash = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey || url.includes('your-project-id')) {
    return null;
  }

  const credsHash = `${url}:${anonKey}`;
  if (!supabaseInstance || lastCredsHash !== credsHash) {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastCredsHash = credsHash;
  }
  return supabaseInstance;
}

// --- LocalStorage helpers for Guest Mode ---
export function getLocalFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalFavorites(items: FavoriteItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function toggleLocalFavorite(academy: Academy): { favorites: FavoriteItem[]; isAdded: boolean } {
  const current = getLocalFavorites();
  const exists = current.some((f) => f.academyId === academy.id);

  let updated: FavoriteItem[];
  let isAdded = false;

  if (exists) {
    updated = current.filter((f) => f.academyId !== academy.id);
  } else {
    isAdded = true;
    const newItem: FavoriteItem = {
      id: `fav_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      academyId: academy.id,
      academyName: academy.name,
      roadAddress: academy.roadAddress,
      realmName: academy.realmName,
      courseName: academy.courseName,
      tel: academy.tel,
      lat: academy.lat,
      lng: academy.lng,
      createdAt: new Date().toISOString(),
    };
    updated = [newItem, ...current];
  }

  saveLocalFavorites(updated);
  return { favorites: updated, isAdded };
}

// --- Supabase Remote Database Sync ---
export async function fetchRemoteFavorites(userId: string): Promise<FavoriteItem[]> {
  const client = getSupabaseClient();
  if (!client) return getLocalFavorites();

  try {
    const { data, error } = await client
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error, fallback to local:', error.message);
      return getLocalFavorites();
    }

    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      academyId: row.academy_id,
      academyName: row.academy_name,
      roadAddress: row.road_address,
      realmName: row.realm_name || '',
      courseName: row.course_name || '',
      tel: row.tel || '',
      lat: Number(row.lat),
      lng: Number(row.lng),
      createdAt: row.created_at,
    }));
  } catch (err) {
    console.warn('Failed to query remote favorites:', err);
    return getLocalFavorites();
  }
}

export async function addRemoteFavorite(userId: string, academy: Academy): Promise<FavoriteItem | null> {
  const client = getSupabaseClient();
  if (!client) {
    const { favorites } = toggleLocalFavorite(academy);
    return favorites.find((f) => f.academyId === academy.id) || null;
  }

  try {
    const insertPayload = {
      user_id: userId,
      academy_id: academy.id,
      academy_name: academy.name,
      road_address: academy.roadAddress,
      realm_name: academy.realmName,
      course_name: academy.courseName,
      tel: academy.tel,
      lat: academy.lat,
      lng: academy.lng,
    };

    const { data, error } = await client
      .from('favorites')
      .upsert(insertPayload, { onConflict: 'user_id, academy_id' })
      .select()
      .single();

    if (error) {
      console.warn('Remote insert error:', error.message);
      toggleLocalFavorite(academy);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      academyId: data.academy_id,
      academyName: data.academy_name,
      roadAddress: data.road_address,
      realmName: data.realm_name || '',
      courseName: data.course_name || '',
      tel: data.tel || '',
      lat: Number(data.lat),
      lng: Number(data.lng),
      createdAt: data.created_at,
    };
  } catch {
    toggleLocalFavorite(academy);
    return null;
  }
}

export async function removeRemoteFavorite(userId: string, academyId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    const current = getLocalFavorites();
    saveLocalFavorites(current.filter((f) => f.academyId !== academyId));
    return true;
  }

  try {
    const { error } = await client
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('academy_id', academyId);

    if (error) {
      console.warn('Remote delete error:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Merge local and remote on login
export async function syncFavoritesOnLogin(userId: string): Promise<FavoriteItem[]> {
  const localList = getLocalFavorites();
  const client = getSupabaseClient();

  if (!client || localList.length === 0) {
    return fetchRemoteFavorites(userId);
  }

  try {
    // Upsert local items to Supabase
    for (const item of localList) {
      await client.from('favorites').upsert(
        {
          user_id: userId,
          academy_id: item.academyId,
          academy_name: item.academyName,
          road_address: item.roadAddress,
          realm_name: item.realmName,
          course_name: item.courseName,
          tel: item.tel,
          lat: item.lat,
          lng: item.lng,
        },
        { onConflict: 'user_id, academy_id' }
      );
    }
    // Fetch combined list
    const remoteList = await fetchRemoteFavorites(userId);
    // Sync back to local storage
    saveLocalFavorites(remoteList);
    return remoteList;
  } catch (err) {
    console.warn('Sync error on login:', err);
    return fetchRemoteFavorites(userId);
  }
}
