// Small fixed preset set for profile avatars — no image assets or icon
// package, just a colored circle + emoji, consistent with how thumbnails work
// in mock-data.ts. avatar_index in the profiles table indexes into this array.
export interface AvatarPreset {
  bg: string;
  emoji: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { bg: '#1a73e8', emoji: '🦊' },
  { bg: '#7c3aed', emoji: '🐼' },
  { bg: '#0d9488', emoji: '🦉' },
  { bg: '#d97706', emoji: '🐯' },
  { bg: '#dc2626', emoji: '🐙' },
  { bg: '#16a34a', emoji: '🐸' },
  { bg: '#db2777', emoji: '🦄' },
  { bg: '#475569', emoji: '🐳' },
];

export function getAvatar(index: number): AvatarPreset {
  return AVATAR_PRESETS[index % AVATAR_PRESETS.length] ?? AVATAR_PRESETS[0];
}
