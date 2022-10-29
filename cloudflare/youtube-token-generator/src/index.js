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

// https://oauth2.example.com/auth?code=4/P7q7W91a-oMsCeLvIaQm6bTrgtp7
router.get("/", async ({query}) => {
	if (query.code) {
    try {
			const params = new URLSearchParams();
			params.append('code', query.code);
			params.append('client_id', GOOGLE_CLIENT_ID);
			params.append('client_secret', GOOGLE_CLIENT_SECRET);
			params.append('redirect_uri', REDIRECT_URI);
			params.append('grant_type', 'authorization_code');

      const response = await fetch(`https://oauth2.googleapis.com/token`, {
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: params.toString(),
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        return new Response(`Access token: ${data.access_token}\nRefresh token: ${data.refresh_token}\nClient ID: ${GOOGLE_CLIENT_ID}`, {
          headers: { 'content-type': 'text/plain' },
        })
      } else {
  			return new Response("400, code already used!", { status: 400 })
			}
    } catch (e) {
      return new Response("400, code incorrect!", { status: 400 })
      console.error(e)
    }
  }
  return new Response("404, not found!", { status: 404 })
})

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
		access_type: 'offline',
    state,
		prompt: 'consent',
	});


  if (error && error.trim().length > 0) {
    return new Response("400, " + error, { status: 400 })
  }

  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});


router.post("/token", async (request) => {
	const newResObj = new Response(request.body)
	const body = await newResObj.text()
	let refreshToken = ''
	body.split('&').forEach(val => val.startsWith('refresh_token')
		? refreshToken = decodeURIComponent(val.replace('refresh_token=', ''))
		: null)


	const params = new URLSearchParams();
	params.append('client_id', GOOGLE_CLIENT_ID);
	params.append('client_secret', GOOGLE_CLIENT_SECRET);
	params.append('refresh_token', refreshToken);
	params.append('grant_type', 'refresh_token');

	const response = await fetch(`https://oauth2.googleapis.com/token`, {
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: params.toString(),
		method: 'POST',
	})
	if (response.ok) {
		const data = await response.json()
		return new Response(JSON.stringify(data), {
			headers: { 'content-type': 'application/json;charset=UTF-8' },
		})
	} else {
		return new Response("400, something went wrong!", { status: 500 })
	}
})


router.all("*", () => new Response("404, not found!", {
  status: 404
}))
addEventListener('fetch', event => {
  event.respondWith(router.handle(event.request))
})