export default function handler(req, res) {
  const clientId = process.env.YAHOO_CLIENT_ID;
  const redirectUri = "https://xclsavage-github-io.vercel.app/api/yahoo/callback";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    state: "dirty-dozen"
  });

  res.writeHead(302, {
    Location: `https://api.login.yahoo.com/oauth2/request_auth?${params.toString()}`
  });

  res.end();
}
