/**
 * USR-PRV-002: Türkiye telefon validasyonu — mobil tarafı.
 * Backend (api/src/routes/users.ts) ile aynı kuralları uygular ki
 * kullanıcı kaydet'e basmadan önce uyarı görsün.
 */

export function normalizePhoneTR(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 12 && digits.startsWith("90") && digits[2] === "5") return "+" + digits;
  if (digits.length === 11 && digits.startsWith("0") && digits[1] === "5") return "+90" + digits.slice(1);
  if (digits.length === 10 && digits[0] === "5") return "+90" + digits;
  return null;
}

export function validatePhoneTR(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null; // boş = sorun yok (silmek istiyor olabilir)
  if (normalizePhoneTR(trimmed)) return null;
  return "Geçerli bir Türkiye numarası girin (örn: 05XX XXX XX XX).";
}
