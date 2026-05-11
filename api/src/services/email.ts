import { config } from "../config";

export async function sendResetEmail(toEmail: string, resetToken: string): Promise<void> {
  if (!config.sendgrid.apiKey) {
    console.log(`[email] SENDGRID_API_KEY tanımlı değil. Reset token for ${toEmail}: ${resetToken}`);
    return;
  }

  const resetUrl = `goworldy://reset-password?token=${resetToken}`;
  const payload = {
    personalizations: [{ to: [{ email: toEmail }] }],
    from: { email: config.sendgrid.fromEmail },
    subject: "GoWorldy — Şifre Sıfırlama",
    content: [
      {
        type: "text/plain",
        value: `Şifrenizi sıfırlamak için aşağıdaki kodu uygulamada kullanın:\n\n${resetToken}\n\nVeya linke tıklayın: ${resetUrl}\n\nBu istek 1 saat geçerlidir. Eğer bu isteği siz yapmadıysanız dikkate almayın.`,
      },
    ],
  };

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.sendgrid.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SendGrid hatası: ${res.status} — ${body}`);
  }
}
