const LATIN1_MOJIBAKE_PATTERN = /\u00C3[\u0080-\u00BF]|\u00C2[\u00A0-\u00BF]/;

function tryDecodeURIComponent(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

function fixLatin1Mojibake(text: string): string {
  if (!LATIN1_MOJIBAKE_PATTERN.test(text)) {
    return text;
  }

  if (typeof TextDecoder === "function") {
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const bytes = Uint8Array.from(Array.from(text, (char) => char.charCodeAt(0) & 0xff));
    try {
      const decoded = decoder.decode(bytes);
      return decoded;
    } catch {
      // ignore decoder errors and fall back to other strategies
    }
  }

  const globalWithEscape = globalThis as typeof globalThis & {
    escape?: (value: string) => string;
  };
  if (typeof globalWithEscape.escape === "function") {
    try {
      const escaped = globalWithEscape.escape(text);
      if (escaped && !/%u[0-9A-Fa-f]{4}/.test(escaped)) {
        return decodeURIComponent(escaped);
      }
    } catch {
      // ignore escape/decode errors and fall back to original text
    }
  }

  return text;
}

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
  const percentDecoded = /%[0-9A-Fa-f]{2}/.test(prepared)
    ? tryDecodeURIComponent(prepared)
    : prepared;

  const latin1Fixed = fixLatin1Mojibake(percentDecoded);

  return latin1Fixed;
}
