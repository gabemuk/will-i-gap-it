/**
 * Safe profile display helpers.
 * Rules:
 *  - Never return email.
 *  - Never return raw user_id.
 *  - null user_id  → "Anonymous"
 *  - missing profile → "Anonymous"
 *  - blank display_name → "Anonymous"
 */

export interface MinimalProfile {
  id: string;
  display_name: string | null;
}

/** Return the display name for a single profile row, or "Anonymous". */
export function getDisplayName(
  profile: Pick<MinimalProfile, 'display_name'> | null | undefined,
): string {
  if (!profile) return 'Anonymous';
  const name = profile.display_name?.trim() ?? '';
  return name.length > 0 ? name : 'Anonymous';
}

/**
 * Build a map from profile id → safe display name.
 * Feed this into getSubmitterName for O(1) lookups.
 */
export function buildProfileMap(
  profiles: MinimalProfile[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of profiles) {
    map.set(p.id, getDisplayName(p));
  }
  return map;
}

/**
 * Look up the display name for a submitter.
 * Returns "Anonymous" when userId is null/undefined or not in the map.
 */
export function getSubmitterName(
  userId: string | null | undefined,
  profileMap: Map<string, string>,
): string {
  if (!userId) return 'Anonymous';
  return profileMap.get(userId) ?? 'Anonymous';
}

/**
 * Given an array of nullable user_id strings, return the distinct
 * non-null ids suitable for a Supabase `.in('id', ids)` query.
 */
export function collectUserIds(
  userIds: (string | null | undefined)[],
): string[] {
  const set = new Set<string>();
  for (const id of userIds) {
    if (id) set.add(id);
  }
  return Array.from(set);
}
