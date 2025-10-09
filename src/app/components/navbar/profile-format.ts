export function normalizeProfileText(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const replaceUnicodeEscapes = (text: string) =>
    text.replace(/%u[0-9a-fA-F]{4}/gi, (match) => {
      const hex = match.slice(2);
      const codePoint = Number.parseInt(hex, 16);
      if (Number.isNaN(codePoint)) {
        return match;
      }
      return String.fromCharCode(codePoint);
    });

  const replacePluses = (text: string) => text.replace(/\+/g, " ");

  const prepare = (text: string) => replacePluses(replaceUnicodeEscapes(text));

  const prepared = prepare(value);

  if (!/%[0-9A-Fa-f]{2}/.test(prepared)) {
    return prepared;
  }

  try {
    return decodeURIComponent(prepared);
  } catch {
    return prepared;
  }
}
