export interface FormValidation {
  valid: boolean;
  error?: string;
}

export function validateLoginForm(email: string, password: string): FormValidation {
  if (!email.trim() || !password) {
    return { valid: false, error: "E-posta ve şifre zorunludur." };
  }
  return { valid: true };
}

export function validateRegisterForm(
  displayName: string,
  email: string,
  password: string
): FormValidation {
  if (!displayName.trim() || !email.trim() || !password) {
    return { valid: false, error: "Tüm alanlar zorunludur." };
  }
  if (password.length < 6) {
    return { valid: false, error: "Şifre en az 6 karakter olmalıdır." };
  }
  return { valid: true };
}
