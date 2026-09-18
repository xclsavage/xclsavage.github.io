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
        code: code,
        redirect_uri: redirectUri,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return res.status(500).json(data);
  }

  res.status(200).json({
    message: "Yahoo connected successfully!",
    token_received: true,
  });
}
