import crypto from "crypto";

function decrypt(token) {
  const key = crypto
    .createHash("sha256")
    .update(process.env.SESSION_SECRET)
    .digest();

  const data = Buffer.from(token, "base64url");

  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const encrypted = data.subarray(28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  return JSON.parse(
    Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8")
  );
}

export default async function handler(req, res) {
  const cookies = req.headers.cookie || "";
  const match = cookies.match(/(?:^|;\s*)yahoo_session=([^;]+)/);

  if (!match) {
    return res.status(401).json({
      error: "Yahoo is not connected."
    });
  }

  try {
    const session = decrypt(match[1]);

    const response = await fetch(
      "https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_codes=nfl?format=json",
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Could not retrieve Yahoo Fantasy data."
    });
  }
}
