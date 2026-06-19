import { createClient } from './supabase/client';
import { THUMBNAIL_COLORS } from './mock-data';
import type { App, AppStatus, Widget } from './types';

// Mirrors the row shape created by docs/supabase-schema.sql.
interface AppRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  status: AppStatus;
  thumbnail: string;
  widgets: Widget[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

function rowToApp(row: AppRow): App {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    thumbnail: row.thumbnail,
    ownerId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at ?? undefined,
    widgets: row.widgets,
  };
}

// Small, intentionally duplicated from storage.ts (not imported from it) —
// cloudStorage.ts must not depend on or modify storage.ts, so the local
// app's localStorage-only behavior stays provably untouched.
function pickThumbnail(existingCount: number): string {
  const keys = Object.keys(THUMBNAIL_COLORS);
  return keys[existingCount % keys.length];
}

export async function listApps(userId: string): Promise<App[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('apps')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data as AppRow[]).map(rowToApp);
}

export async function getApp(id: string): Promise<App | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('apps')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToApp(data as AppRow) : null;
}

export async function createApp(userId: string, name = 'Untitled App'): Promise<App> {
  const supabase = createClient();
  const existing = await listApps(userId);
  const thumbnail = pickThumbnail(existing.length);

  const { data, error } = await supabase
    .from('apps')
    .insert({ user_id: userId, name, thumbnail, widgets: [] })
    .select()
    .single();

  if (error) throw error;
  return rowToApp(data as AppRow);
}

export async function saveApp(id: string, patch: Partial<Pick<App, 'name' | 'widgets'>>): Promise<void> {
  const supabase = createClient();

  // Mirror storage.ts's saveApp: editing a published app reverts it to draft.
  const { data: current, error: fetchError } = await supabase
    .from('apps')
    .select('status')
    .eq('id', id)
    .maybeSingle();
  if (fetchError) throw fetchError;

  const updatePatch: Record<string, unknown> = { ...patch, updated_at: new Date().toISOString() };
  if (current?.status === 'published') {
    updatePatch.status = 'draft';
    updatePatch.published_at = null;
  }

  const { error } = await supabase.from('apps').update(updatePatch).eq('id', id);
  if (error) throw error;
}

export async function deleteApp(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('apps').delete().eq('id', id);
  if (error) throw error;
}

export async function publishApp(id: string): Promise<App | null> {
  const supabase = createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('apps')
    .update({ status: 'published', published_at: now, updated_at: now })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data ? rowToApp(data as AppRow) : null;
}

export async function duplicateApp(id: string, userId: string): Promise<App | null> {
  const original = await getApp(id);
  if (!original) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('apps')
    .insert({
      user_id: userId,
      name: `${original.name} Copy`,
      description: original.description,
      status: 'draft',
      thumbnail: original.thumbnail,
      widgets: original.widgets,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToApp(data as AppRow);
}
