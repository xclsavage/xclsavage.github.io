import crypto from "crypto";

function encrypt(text) {
  const key = crypto
    .createHash("sha256")
    .update(process.env.SESSION_SECRET)
    .digest();

  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Missing Yahoo authorization code.");
  }

  const redirectUri =
    "https://xclsavage-github-io.vercel.app/api/yahoo/callback";

  const credentials = Buffer.from(
    `${process.env.YAHOO_CLIENT_ID}:${process.env.YAHOO_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(
    "https://api.login.yahoo.com/oauth2/get_token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return res.status(500).json(data);
  }

  const session = encrypt(
    JSON.stringify({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    })
  );

  res.setHeader(
    "Set-Cookie",
    `yahoo_session=${session}; Path=/; HttpOnly; Secure; SameSite=Lax`
  );

  res.redirect("/");
}
