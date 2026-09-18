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

export default function handler(req, res) {
  const cookies = req.headers.cookie || "";

  const match = cookies.match(/(?:^|;\s*)yahoo_session=([^;]+)/);

  if (!match) {
    return res.status(200).json({
      connected: false,
    });
  }

  try {
    const session = decrypt(match[1]);

    return res.status(200).json({
      connected: true,
      yahoo_connected: !!session.refresh_token,
    });
  } catch (error) {
    return res.status(200).json({
      connected: false,
    });
  }
}
