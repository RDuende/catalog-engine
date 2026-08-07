export function makitoHeaders():
  Readonly<Record<string, string>> {
  const headers:
    Record<string, string> = {
      accept:
        "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "user-agent":
        "RecuerdArte Makito Image Manager/1.0",
    };

  const bearer =
    process.env.MAKITO_AUTH_TOKEN ??
    process.env.MAKITO_TOKEN;

  const apiKey =
    process.env.MAKITO_API_KEY;

  const cookie =
    process.env.MAKITO_COOKIE;

  const authorization =
    process.env
      .MAKITO_AUTHORIZATION;

  if (authorization) {
    headers.authorization =
      authorization;
  } else if (bearer) {
    headers.authorization =
      bearer.startsWith("Bearer ")
        ? bearer
        : `Bearer ${bearer}`;
  }

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  if (cookie) {
    headers.cookie = cookie;
  }

  return Object.freeze(headers);
}
