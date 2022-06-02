import {
  Router
} from 'itty-router'
import axios from 'axios';

// Create a new router
const router = Router()

const scopes = [
  'user:edit',
  'user:read:email',
]

router.get("*", async (opts) => {
  const error = opts.query.error;
  const state = decodeURIComponent(opts.query.state || '');
  const code = opts.query.access_token;

  if (error && error.trim().length > 0) {
    return new Response("400, " + error, { status: 400 })
  }

  if (code && code.trim().length > 0) {
    try {
      console.log('redirecting to', JSON.parse(atob(state)).url + '/oauth')
      return Response.redirect(`${JSON.parse(atob(state)).url}/oauth?code=${code}&state=${state}`);
    } catch (e) {
      // TODO: remove this legacy code
      console.log('legacy redirecting to', atob(state) + '/oauth')
      return Response.redirect(`${atob(state)}/oauth?code=${code}&state=${state}`);
    }
  } else {
    return Response.redirect(`https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=http://oauth.sogebot.xyz/&response_type=token&scope=${scopes.join('+')}&state=${state}&force_verify=true`);
  }
});

router.all("*", () => new Response("404, not found!", {
  status: 404
}))

addEventListener('fetch', event => {
  event.respondWith(router.handle(event.request))
})