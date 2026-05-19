export interface PremiumUserLike {
  isPremium?: boolean | null;
  premiumUntil?: string | null;
}

export function hasActivePremium(user: PremiumUserLike | null | undefined): boolean {
  if (!user) return false;
  if (user.isPremium !== true) return false;
  if (!user.premiumUntil) return true;
  const expiry = new Date(user.premiumUntil);
  if (isNaN(expiry.getTime())) return false;
  return expiry.getTime() > Date.now();
}
