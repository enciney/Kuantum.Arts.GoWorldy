export function popularityScore(
  upvotes: number | null | undefined,
  commentCount: number | null | undefined
): number {
  const u = typeof upvotes === "number" && Number.isFinite(upvotes) ? upvotes : 0;
  const c = typeof commentCount === "number" && Number.isFinite(commentCount) ? commentCount : 0;
  return u * 2 + c;
}
