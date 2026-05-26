/**
 * Unit tests — SEC-SAN-001: XSS Sanitization
 * api/src/utils/sanitize.ts
 */
import { sanitizeContent, sanitizeTitle } from "../../src/utils/sanitize";

// ── sanitizeContent ──────────────────────────────────────────────────────────

describe("sanitizeContent", () => {
  it("plain text geçmeli, değişmemeli", () => {
    expect(sanitizeContent("Bu normal bir yorum.")).toBe("Bu normal bir yorum.");
  });

  it("<script> tagını tamamen soymalı", () => {
    expect(sanitizeContent("<script>alert('xss')</script>")).toBe("");
  });

  it("gömülü script içeriği soyulmalı ama metin kalmalı", () => {
    expect(sanitizeContent("Merhaba <script>evil()</script> dünya")).toBe("Merhaba  dünya");
  });

  it("<b><i> gibi formatlama taglarını soymalı", () => {
    expect(sanitizeContent("Merhaba <b>dünya</b>!")).toBe("Merhaba dünya!");
  });

  it("img onerror XSS saldırısını temizlemeli", () => {
    expect(sanitizeContent('<img src=x onerror="alert(1)">')).toBe("");
  });

  it("javascript: link XSS saldırısını temizlemeli", () => {
    expect(sanitizeContent('<a href="javascript:alert()">tıkla</a>')).toBe("tıkla");
  });

  it("HTML entity'leri encode'lu bırakmalı (güvenli davranış — XSS önleme)", () => {
    // sanitize-html güvenlik gereği &lt; / &gt; encode'lu bırakır.
    // React Native Text bileşeni bunu literal gösterir; tarayıcıda ise güvenli render edilir.
    const result = sanitizeContent("1 &lt; 2 &gt; 0");
    expect(result).toBe("1 &lt; 2 &gt; 0");
  });

  it("iframe injection saldırısını temizlemeli", () => {
    expect(sanitizeContent('<iframe src="evil.com"></iframe>')).toBe("");
  });

  it("SVG tabanlı XSS saldırısını temizlemeli", () => {
    expect(sanitizeContent('<svg onload="alert(1)"></svg>')).toBe("");
  });

  it("başındaki ve sonundaki boşlukları trim etmeli", () => {
    expect(sanitizeContent("  temiz metin  ")).toBe("temiz metin");
  });

  it("çok satırlı text olduğu gibi kalmalı", () => {
    const input = "Birinci satır\nİkinci satır\nÜçüncü satır";
    expect(sanitizeContent(input)).toBe(input);
  });

  it("Türkçe karakterler bozulmamalı", () => {
    const input = "Göç etmek istiyorum, şehir aramaya başladım.";
    expect(sanitizeContent(input)).toBe(input);
  });

  it("boş string boş string dönmeli", () => {
    expect(sanitizeContent("")).toBe("");
  });

  it("yalnızca HTML olan içerik boş string dönmeli", () => {
    expect(sanitizeContent("<div><p><span></span></p></div>")).toBe("");
  });
});

// ── sanitizeTitle ────────────────────────────────────────────────────────────

describe("sanitizeTitle", () => {
  it("plain text başlık geçmeli", () => {
    expect(sanitizeTitle("Almanya vize başvurusu nasıl yapılır?")).toBe("Almanya vize başvurusu nasıl yapılır?");
  });

  it("script enjeksiyonu temizlenmeli", () => {
    expect(sanitizeTitle("<script>document.cookie</script> İyi başlık")).toBe("İyi başlık");
  });

  it("HTML tagları sıyrılmalı", () => {
    expect(sanitizeTitle("<h1>Başlık</h1>")).toBe("Başlık");
  });

  it("başındaki ve sonundaki boşlukları trim etmeli", () => {
    expect(sanitizeTitle("  Başlık metnii  ")).toBe("Başlık metnii");
  });

  it("Türkçe karakterler korunmalı", () => {
    const t = "İsviçre'de yaşamak: çalışma izni ve öğrenim fırsatları";
    expect(sanitizeTitle(t)).toBe(t);
  });
});
