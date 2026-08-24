/*
  cms-oauth-worker.js
  Deploy this as a Cloudflare Worker (free tier). It lets your /admin dashboard
  log in with GitHub, so Decap CMS can commit edits to your repo.

  SETUP STEPS:
  1. On GitHub: Settings > Developer settings > OAuth Apps > New OAuth App
       Homepage URL:            https://your-domain.com
       Authorization callback:  https://your-worker-subdomain.workers.dev/callback
     Save the generated Client ID and Client Secret.

  2. On Cloudflare dashboard: Workers & Pages > Create Worker.
     Paste this whole file in as the Worker code.

  3. In the Worker's Settings > Variables, add two secrets:
       GITHUB_CLIENT_ID     = (from step 1)
       GITHUB_CLIENT_SECRET = (from step 1)

  4. Deploy. Note your worker URL, e.g. https://flygerians-cms-auth.yourname.workers.dev

  5. In admin/config.yml, set base_url to that worker URL (already set up in
     the config.yml provided alongside this file).
*/

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

function renderCallbackPage(status, provider, payload) {
  const message = JSON.stringify({ token: payload.token, provider }).replace(/</g, '\\u003c');
  return `<!DOCTYPE html><html><body>
<script>
  (function() {
    function receiveMessage(e) {
      window.opener.postMessage(
        'authorization:${provider}:${status}:${message}',
        e.origin
      );
      window.removeEventListener('message', receiveMessage, false);
    }
    window.addEventListener('message', receiveMessage, false);
    window.opener.postMessage('authorizing:${provider}', '*');
  })();
</script>
</body></html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/auth') {
      const authUrl = new URL(GITHUB_AUTHORIZE_URL);
      authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      authUrl.searchParams.set('scope', 'repo,user');
      authUrl.searchParams.set('redirect_uri', `${url.origin}/callback`);
      return Response.redirect(authUrl.toString(), 302);
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) return new Response('Missing code', { status: 400 });

      const tokenRes = await fetch(GITHUB_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });
      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        return new Response(`OAuth error: ${tokenData.error_description || tokenData.error}`, { status: 400 });
      }

      const html = renderCallbackPage('success', 'github', { token: tokenData.access_token });
      return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    }

    return new Response('Flygerians CMS OAuth proxy is running.', { status: 200 });
  },
};
