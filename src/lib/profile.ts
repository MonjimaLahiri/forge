import { createClient } from './supabase/client';

export interface Profile {
  id: string;
  displayName: string | null;
  avatarIndex: number;
  createdAt: string;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  avatar_index: number;
  created_at: string;
}

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarIndex: row.avatar_index,
    createdAt: row.created_at,
  };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToProfile(data as ProfileRow) : null;
}

// Profile rows are normally created by the handle_new_user() trigger (see
// docs/supabase-schema.sql) at signup. Accounts created before that trigger
// existed have no row at all, so this upserts rather than updates — a plain
// UPDATE against a missing row succeeds with zero rows affected and no error,
// which silently drops the save. The INSERT policy in the schema only allows
// a user to insert a row with their own id, matching the existing UPDATE policy.
export async function saveProfile(
  userId: string,
  patch: { displayName: string; avatarIndex: number },
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, display_name: patch.displayName, avatar_index: patch.avatarIndex });

  if (error) throw error;
}

export function isProfileComplete(profile: Profile | null): boolean {
  return !!profile?.displayName?.trim();
}

// Shared by login, signup (immediate-session case), and password reset —
// scoped to the moment right after a successful sign-in, not a global gate.
export async function getPostAuthRedirect(userId: string): Promise<'/dashboard' | '/profile-setup'> {
  const profile = await getProfile(userId);
  return isProfileComplete(profile) ? '/dashboard' : '/profile-setup';
}
