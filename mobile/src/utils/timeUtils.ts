export function formatTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Süresi doldu";
  const totalMinutes = Math.floor(diff / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours >= 24) {
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return `${days} gün ${hours} saat kaldı`;
  }
  const minutes = totalMinutes % 60;
  return `${totalHours} saat ${minutes} dakika kaldı`;
}

export function formatPremiumUntil(expiresAt: string): string {
  const date = new Date(expiresAt);
  if (isNaN(date.getTime()) || date.getTime() <= Date.now()) return "Süreniz dolmuş";
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year} tarihine kadar premimumsunuz`;
}
