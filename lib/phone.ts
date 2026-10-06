/**
 * Utilitas nomor HP Indonesia.
 * Kanonik: "08xxxxxxxxxx". Menerima "+628…", "628…", "08…", dengan spasi/tanda hubung.
 */

/** Kembalikan nomor kanonik (08…) atau null jika bukan nomor HP valid. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "");
  if (!/^\+?\d{8,15}$/.test(digits)) return null;

  let local = digits.replace(/^\+/, "");
  if (local.startsWith("62")) local = "0" + local.slice(2);
  else if (local.startsWith("8")) local = "0" + local;

  return /^08\d{7,13}$/.test(local) ? local : null;
}

/** Semua bentuk penulisan yang mungkin tersimpan di DB untuk nomor kanonik. */
export function phoneVariants(canonical: string): string[] {
  const rest = canonical.slice(1); // buang "0"
  return [canonical, `62${rest}`, `+62${rest}`];
}
