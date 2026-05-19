export interface FavoriteTopic {
  id: string;
  title: string;
  content?: string;
  commentCount: number;
  createdAt: string;
}

export function mergePages<T extends { id: string }>(prev: T[], next: T[]): T[] {
  if (!next || next.length === 0) return prev;
  if (!prev || prev.length === 0) return dedupeById(next);
  return dedupeById([...prev, ...next]);
}

export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (!item || !item.id) continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

export function hasMore(received: number, limit: number): boolean {
  return received >= limit;
}
