/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npx wrangler dev src/index.js` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npx wrangler publish src/index.js --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
 import {
  Router
} from 'itty-router'
import queryString from 'query-string';

const router = Router()

router.get("/login", async (opts) => {
  const error = opts.query.error;
  const state = decodeURIComponent(opts.query.state || '');
  const code = opts.query.access_token;

  const scopes = [
    'https://www.googleapis.com/auth/youtube'
  ]

  const params = queryString.stringify({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: scopes.join(' '),
    include_granted_scopes: "true",
    state,
});


  if (error && error.trim().length > 0) {
    return new Response("400, " + error, { status: 400 })
  }

  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});


router.all("*", () => new Response("404, not found!", {
  status: 404
}))
addEventListener('fetch', event => {
  event.respondWith(router.handle(event.request))
})