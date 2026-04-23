export function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .reduce<Record<string, string>>((accumulator, part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex < 0) {
        return accumulator;
      }

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      if (!key) {
        return accumulator;
      }

      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {});
}

export function serializeSessionCookie(input: {
  cookieName: string;
  token: string;
  maxAgeSeconds: number;
  secure: boolean;
}): string {
  const base = [
    `${input.cookieName}=${encodeURIComponent(input.token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${input.maxAgeSeconds}`
  ];

  if (input.secure) {
    base.push("Secure");
  }

  return base.join("; ");
}

export function clearSessionCookie(input: {
  cookieName: string;
  secure: boolean;
}): string {
  const base = [
    `${input.cookieName}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0"
  ];

  if (input.secure) {
    base.push("Secure");
  }

  return base.join("; ");
}
