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

const clientId = DONATIONALERTS_CLIENTID
const clientSecret = DONATIONALERTS_CLIENTSECRET

const router = Router()
router.post("/", async (response, request) => {
  const responseHeaders = new Headers(response.headers)
  responseHeaders.set('Access-Control-Allow-Origin', '*') // todo: change to https://dash.sogebot.xyz
  responseHeaders.set('content-type', 'application/json')

  const data = await request.json();

	if (data.refreshToken) {
    try {
      const body =
      `grant_type=refresh_token&` +
      `client_secret=${clientSecret}&` +
      `refresh_token=${data.refreshToken}&` +
      `scope=oauth-user-show+oauth-donation-subscribe+oauth-donation-index&` +
      `client_id=${clientId}`;

      const response = await fetch('https://www.donationalerts.com/oauth/token', {
        method: 'POST',
        body,
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      if (!response.ok) {
    		const json = await response.json();
        return new Response(JSON.stringify(json, undefined, 2), { status: 400, headers: responseHeaders })
      }

      const json = await response.json();
      return new Response(JSON.stringify(json), {
        headers: responseHeaders,
      })
    } catch (e) {
      return new Response(`{ "error": "400, ${e.message}!" }`, { status: 400, headers: responseHeaders })
      console.error(e)
    }
  }
  return new Response("404, not found!", { status: 404 })
})

router.get("/", async ({query, headers}) => {
  const responseHeaders = new Headers(headers)
  responseHeaders.set('Access-Control-Allow-Origin', '*') // todo: change to https://dash.sogebot.xyz
  responseHeaders.set('content-type', 'application/json')

	if (query.code) {
    try {
      const body =
      `grant_type=authorization_code&` +
      `client_secret=${clientSecret}&` +
      `redirect_uri=https://dash.sogebot.xyz/credentials/donationalerts&` +
      `code=${query.code}&` +
      `client_id=${clientId}`;

      const response = await fetch('https://www.donationalerts.com/oauth/token', {
        method: 'POST',
        body,
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      if (!response.ok) {
    		const json = await response.json();
        return new Response(JSON.stringify(json, undefined, 2), { status: 400, headers: responseHeaders })
      }

      const json = await response.json();
      return new Response(JSON.stringify(json), {
        headers: responseHeaders,
      })
    } catch (e) {
      return new Response(`{ "error": "400, ${e.message}!" }`, { status: 400, headers: responseHeaders })
      console.error(e)
    }
  } else {
    // redirect to donationalerts login
    return Response.redirect(`https://www.donationalerts.com/oauth/authorize?client_id=${clientId}&redirect_uri=https://dash.sogebot.xyz/credentials/donationalerts&response_type=code&scope=oauth-user-show+oauth-donation-subscribe+oauth-donation-index`);
  }
  return new Response("404, not found!", { status: 404 })
})

router.all("*", () => new Response("404, not found!", {
  status: 404
}))
addEventListener('fetch', event => {
  event.respondWith(router.handle(event.request, event.request))
})