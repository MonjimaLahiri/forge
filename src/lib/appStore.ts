import * as local from './storage';
import * as cloud from './cloudStorage';
import { createClient } from './supabase/client';
import type { App } from './types';

// Auth-aware facade in front of storage.ts (localStorage) and cloudStorage.ts
// (Supabase). Logged-out users keep using storage.ts exactly as before —
// it is never modified, only called — so existing local behavior can't
// regress here. Logged-in users are dispatched to cloudStorage.ts instead.
//
// getSession() reads the persisted session locally (no network round-trip),
// unlike getUser(), which revalidates against the server — appropriate here
// since this just decides which storage backend to use, not a security check.
async function getUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function listApps(): Promise<App[]> {
  const userId = await getUserId();
  if (!userId) return local.listApps();
  return cloud.listApps(userId);
}

export async function getApp(id: string): Promise<App | null> {
  const userId = await getUserId();
  if (!userId) return local.getApp(id);
  return cloud.getApp(id);
}

export async function createApp(name = 'Untitled App'): Promise<App> {
  const userId = await getUserId();
  if (!userId) return local.createApp(name);
  return cloud.createApp(userId, name);
}

export async function saveApp(id: string, patch: Partial<Pick<App, 'name' | 'widgets'>>): Promise<void> {
  const userId = await getUserId();
  if (!userId) {
    local.saveApp(id, patch);
    return;
  }
  return cloud.saveApp(id, patch);
}

export async function deleteApp(id: string): Promise<void> {
  const userId = await getUserId();
  if (!userId) {
    local.deleteApp(id);
    return;
  }
  return cloud.deleteApp(id);
}

export async function publishApp(id: string): Promise<App | null> {
  const userId = await getUserId();
  if (!userId) return local.publishApp(id);
  return cloud.publishApp(id);
}

export async function duplicateApp(id: string): Promise<App | null> {
  const userId = await getUserId();
  if (!userId) return local.duplicateApp(id);
  return cloud.duplicateApp(id, userId);
}

// ── Local-to-cloud import (Phase 6.5) ──────────────────────────────────────

// Local apps not yet present in the signed-in user's cloud apps. Returns []
// when logged out (nothing to import yet) or when there's nothing pending —
// recomputed fresh each call, so a successfully imported app naturally drops
// out next time rather than needing a separate "already imported" flag.
export async function getLocalAppsPendingImport(): Promise<App[]> {
  const userId = await getUserId();
  if (!userId) return [];

  const localApps = local.listApps();
  if (localApps.length === 0) return [];

  const cloudApps = await cloud.listApps(userId);
  const cloudIds = new Set(cloudApps.map((a) => a.id));
  return localApps.filter((a) => !cloudIds.has(a.id));
}

export interface ImportResult {
  imported: App[];
  failed: App[];
}

// Imports each app independently — one failure doesn't block the rest, and a
// failed app simply stays "pending" (still in localStorage, untouched) to be
// offered again later. Never deletes anything from localStorage.
export async function importLocalApps(apps: App[]): Promise<ImportResult> {
  const userId = await getUserId();
  if (!userId) return { imported: [], failed: apps };

  const imported: App[] = [];
  const failed: App[] = [];

  for (const app of apps) {
    try {
      await cloud.importApp(app, userId);
      imported.push(app);
    } catch {
      failed.push(app);
    }
  }

  return { imported, failed };
}
