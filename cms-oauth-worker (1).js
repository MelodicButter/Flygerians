/*
  cms-oauth-worker.js (v2 — with CSRF state protection)
  Deploy as a Cloudflare Worker (free tier). Lets /admin log in with GitHub
  so Decap CMS can commit edits to your repo.

  SETUP:
  1. GitHub > Settings > Developer settings > OAuth Apps > New OAuth App
       Homepage URL:            https://your-domain.com
       Authorization callback:  https://your-worker-subdomain.workers.dev/callback
  2. Cloudflare dashboard > Workers & Pages > Create Worker > paste this file.
  3. Worker > Settings > Variables > add secrets:
       GITHUB_CLIENT_ID
       GITHUB_CLIENT_SECRET
  4. Deploy. Set admin/config.yml's base_url to your worker's URL.
*/

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const STATE_COOKIE = '__Host-cms_oauth_state';

function randomState() {
  return crypto.randomUUID().replace(/-/g, '');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

function getCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function renderCallbackPage(status, provider, payload) {
  const message = JSON.stringify({ token: payload.token, provider }).replace(/</g, '\\u003c');
  return `<!DOCTYPE html><html><body>
<script>
  (function() {
    function receiveMessage(e) {
      window.opener.postMessage('authorization:${provider}:${status}:${message}', e.origin);
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
      const state = randomState();
      const authUrl = new URL(GITHUB_AUTHORIZE_URL);
      authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      authUrl.searchParams.set('scope', 'repo,user');
      authUrl.searchParams.set('redirect_uri', `${url.origin}/callback`);
      authUrl.searchParams.set('state', state);

      return new Response(null, {
        status: 302,
        headers: {
          Location: authUrl.toString(),
          'Set-Cookie': `${STATE_COOKIE}=${state}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=600`,
        },
      });
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const returnedState = url.searchParams.get('state');
      const savedState = getCookie(request, STATE_COOKIE);

      if (!code) return new Response('Missing code', { status: 400 });
      if (!returnedState || !savedState || !timingSafeEqual(returnedState, savedState)) {
        return new Response('Invalid or expired state — possible CSRF attempt. Please try logging in again.', { status: 403 });
      }

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
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Set-Cookie': `${STATE_COOKIE}=; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=0`,
        },
      });
    }

    return new Response('Flygerians CMS OAuth proxy is running.', { status: 200 });
  },
};
