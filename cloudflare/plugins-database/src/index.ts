/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import * as uuid from 'uuid';

export interface Env {
	PLUGINS: KVNamespace,
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
}

const getFullList = async (env: Env, list?: any[], cursor?: string): Promise<any[]> => {
	list ??= [];

	const fetched = await env.PLUGINS.list({ cursor });
	list = [...list, ...fetched.keys.map(o => o.name)];
	if (fetched.list_complete) {
		// we remove plugins (we need them only on import)
		return (await Promise.all(list.filter(id => !id.includes('plugin')).map(async (id) => ({
			id,
			value: JSON.parse(await env.PLUGINS.get(id) || '')
		}))))
	} else {
		return await getFullList(env, list, fetched.cursor);
	}
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		const key = request.url.replace('https://plugins-database.soge.workers.dev/', '');

		if (uuid.validate(key)) {
			// show plugin
			if (request.method === 'GET') {
				const getValueFromKey = await env.PLUGINS.get(`${key}|plugin`);
				return new Response(JSON.parse(await env.PLUGINS.get(`${key}|plugin`) || '""'));
			}

			// add new vote or replace old one
			if (request.method === 'POST') {
				let votes =  JSON.parse(await env.PLUGINS.get(`${key}|votes`) || '[]') as string[];
				const userId = request.headers.get('Twitch-userId') || '';
				const vote = request.headers.get('Vote') || '';
				if (userId.length > 0 && (vote === '+' || vote === '-')) {
					votes = votes.filter(o => !o.includes(userId));
					votes.push(`${userId}|${vote}`)
					await env.PLUGINS.put(`${key}|votes`, JSON.stringify(votes));
				}
				return new Response('OK');
			}

			// remove vote
			if (request.method === 'DELETE') {
				let votes =  JSON.parse(await env.PLUGINS.get(`${key}|votes`) || '[]') as string[];
				const userId = request.headers.get('Twitch-userId') || '';
				if (userId.length > 0) {
					votes = votes.filter(o => !o.includes(userId));
					await env.PLUGINS.put(`${key}|votes`, JSON.stringify(votes));
				}
				return new Response('OK');

			}
		}

		// default GET
		if (request.method === 'GET') {
			const list = await getFullList(env);
			return new Response(JSON.stringify({ data: list }), { headers: { 'content-type': 'application/json' }});
		}

		if (request.method === 'POST') {
			const userId = request.headers.get('Twitch-userId') || '';
			const contentType = request.headers.get('content-type') || '';

			if (userId.length > 0) {
				if (contentType.includes('form')) {
					const formData = await request.formData();
					const body: Record<string, string | File> = {};
					for (const entry of formData.entries()) {
						body[entry[0]] = entry[1];
					}
					if (body.plugin && body.description && body.version && body.title) {
						const key = uuid.v4();
						await env.PLUGINS.put(`${key}|votes`, JSON.stringify([]));
						await env.PLUGINS.put(`${key}|plugin`, JSON.stringify(body.plugin));
						await env.PLUGINS.put(`${key}|details`, JSON.stringify({
							description: body.description,
							title: body.title,
							createdBy: userId,
							addedAt: new Date().toISOString(),
							version: body.version,
						}));
					}
			}
			return new Response('OK');

		}
	}
	return new Response();
}
};




		//console.log(JSON.stringify({list, getValueFromKey}, undefined, 2))

		// we need plugin to be in own dataset to be sure we don't push to limits (shouldn't be case but in very popular plugins we may reach votes cap)

		/*// votes in format userId+ or userId-
		await env.PLUGINS.put(`${key}|votes`, JSON.stringify([ '96965261+' ]));
		// details without plugin
		await env.PLUGINS.put(`${key}|details`, JSON.stringify({
			description: 'Viewers can challenge themselves with !fightme',
			title: '!fightme plugin',
			createdBy: '96965261',
			addedAt: '2022-11-05T13:49:51.915Z',
			version: '1.0',
		}));
		// plugin in own key
		await env.PLUGINS.put(`${key}|plugin`, JSON.stringify('eyJkcmF3ZmxvdyI6eyJIb21lIjp7ImRhdGEiOnsiMSI6eyJpZCI6MSwibmFtZSI6Imxpc3RlbmVyIiwiZGF0YSI6eyJ2YWx1ZSI6InR3aXRjaENvbW1hbmQiLCJkYXRhIjoie1wiY29tbWFuZFwiOlwie3NldHRpbmdzLmNvbW1hbmR9XCIsXCJwYXJhbWV0ZXJzXCI6W3tcImlkXCI6XCIxNzRiZTQ2MC1hOGFjLTQ4MjYtYjdmMC1kZWY2YTE3Yjc5ZmVcIixcIm5hbWVcIjpcInVzZXJOYW1lXCIsXCJ0eXBlXCI6XCJjdXN0b21cIixcInJlZ2V4cFwiOlwiQD9bQS1aYS16MC05X10rXCJ9XX0ifSwiY2xhc3MiOiJsaXN0ZW5lciIsImh0bWwiOiJsaXN0ZW5lciIsInR5cGVub2RlIjoidnVlIiwiaW5wdXRzIjp7fSwib3V0cHV0cyI6eyJvdXRwdXRfMSI6eyJjb25uZWN0aW9ucyI6W3sibm9kZSI6IjE0Iiwib3V0cHV0IjoiaW5wdXRfMSJ9XX19LCJwb3NfeCI6NDQyLCJwb3NfeSI6MTkzLjQyODU3MTQyODU3MTQyfSwiMTQiOnsiaWQiOjE0LCJuYW1lIjoicnVuU2NyaXB0IiwiZGF0YSI6eyJ2YWx1ZSI6ImF3YWl0IGRlYnVnKClcblxuLy8gdGlkeWZ5IHVzZXJuYW1lXG5jb25zdCB1c2VyTmFtZSA9IHBhcmFtZXRlcnMudXNlck5hbWUucmVwbGFjZSgnQCcsICcnKTs7XG5cbi8vIGNoZWNrIGlmIHVzZXIgaXMgdHJ5aW5nIHRvIGZpZ2h0IHdpdGggdGhlbXNlbHZlc1xuaWYgKHVzZXJOYW1lLnRvTG93ZXJDYXNlKCkgPT09IHNlbmRlci51c2VyTmFtZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgdHdpdGNoLnNlbmRNZXNzYWdlKHNldHRpbmdzLk1lc3NhZ2VDYW5ub3RGaWdodFdpdGhZb3Vyc2VsZik7XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbi8vIGdldCBjaGFsbGVuZ2VzIGZyb20gZGF0YWJhc2UgYW5kIGZpbHRlciBvbGQgY2hhbGxlbmdlc1xubGV0IGNoYWxsZW5nZXMgPSBhd2FpdCB2YXJpYWJsZS5sb2FkKCdjaGFsbGVuZ2VzJykgPz8gW107XG5jaGFsbGVuZ2VzID0gY2hhbGxlbmdlcy5maWx0ZXIobyA9PiBvLmlzc3VlZEF0ICsgMiAqIDYwMDAwID4gRGF0ZS5ub3coKSk7XG5cbi8vIGNoZWNrIGlmIHNlbmRlciBpcyBjYXN0ZXIgb3IgbW9kXG5jb25zdCB1c2VySXNNb2RPckNhc3RlciA9IFxuICBhd2FpdCBjaGVja3MuaXNVc2VyTW9kZXJhdG9yKHNlbmRlci51c2VyTmFtZSkgfHxcbiAgYXdhaXQgY2hlY2tzLmlzVXNlckNhc3RlcihzZW5kZXIudXNlck5hbWUpXG5cbi8vIGdldCBjb29sZG93biBmcm9tIGRhdGFiYXNlXG5sZXQgY29vbGRvd24gPSBcbiAgc2V0dGluZ3MuQ29vbGRvd25FbmFibGVkICYmXG4gICEoc2V0dGluZ3MuQ29vbGRvd25CeXBhc3NCeU1vZHNBbmRDYXN0ZXIgJiYgdXNlcklzTW9kT3JDYXN0ZXIpXG4gID8gYXdhaXQgdmFyaWFibGUubG9hZCgnY29vbGRvd24nKSA/PyBzZXR0aW5ncy5Db29sZG93blRpbWVcbiAgOiAwO1xuXG4vLyBpcyB1c2VyIGNoYWxsZW5nZWQgYnkgYW5vdGhlciB1c2VyP1xuY29uc3QgY2hhbGxlbmdlID0gY2hhbGxlbmdlcy5maW5kKGNoID0+IHtcbiAgcmV0dXJuIGNoLnRvID09PSBzZW5kZXIudXNlck5hbWVcbiAgICAmJiBjaC5mcm9tID09PSB1c2VyTmFtZTtcbn0pO1xuXG5pZiAoY2hhbGxlbmdlKSB7XG4gIC8vIHZzIGJyb2FkY2FzdGVyXG4gIGlmIChjaGVja3MuaXNVc2VyQ2FzdGVyKHNlbmRlci51c2VyTmFtZSkgfHwgY2hlY2tzLmlzVXNlckNhc3Rlcih1c2VyTmFtZSkpIHtcbiAgICBpZiAoc2V0dGluZ3MuVGltZW91dExvc2VyKSB7XG4gICAgICB0d2l0Y2gudGltZW91dChjaGVja3MuaXNVc2VyQ2FzdGVyKHNlbmRlci51c2VyTmFtZSkgPyBzZW5kZXIudXNlck5hbWUgOiB1c2VyTmFtZSwgc2V0dGluZ3MuVGltZW91dExvc2VyKVxuICAgIH1cbiAgICB0d2l0Y2guc2VuZE1lc3NhZ2UoXG4gICAgICBzZXR0aW5ncy5NZXNzYWdlUmVzdWx0QnJvYWRjYXN0ZXJcbiAgICAgICAgLnJlcGxhY2UoJyRsb3NlcicsIGNoZWNrcy5pc1VzZXJDYXN0ZXIoc2VuZGVyLnVzZXJOYW1lKSA/IHVzZXJOYW1lIDogc2VuZGVyLnVzZXJOYW1lKVxuICAgICAgICAucmVwbGFjZSgnJHdpbm5lcicsIGNoZWNrcy5pc1VzZXJDYXN0ZXIoc2VuZGVyLnVzZXJOYW1lKSA/IHNlbmRlci51c2VyTmFtZSA6IHVzZXJOYW1lKVxuICAgIClcbiAgfSBlbHNlIHtcbiAgICBjb25zdCByZXN1bHQgPSBNYXRoLnJhbmRvbSgpID4gMC41O1xuICAgIGNvbnN0IHdpbm5lciA9IHJlc3VsdCA/IHNlbmRlci51c2VyTmFtZSA6IHVzZXJOYW1lO1xuICAgIGNvbnN0IGxvc2VyID0gIXJlc3VsdCA/IHNlbmRlci51c2VyTmFtZSA6IHVzZXJOYW1lO1xuICAgIFxuICAgIGlmIChzZXR0aW5ncy5UaW1lb3V0TG9zZXIpIHtcbiAgICAgIHR3aXRjaC50aW1lb3V0KGxvc2VyLCBzZXR0aW5ncy5UaW1lb3V0TG9zZXIpXG4gICAgICB0d2l0Y2guc2VuZE1lc3NhZ2UoXG4gICAgICAgIHNldHRpbmdzLk1lc3NhZ2VSZXN1bHRcbiAgICAgICAgICAucmVwbGFjZSgnJGxvc2VyJywgbG9zZXIpXG4gICAgICAgICAgLnJlcGxhY2UoJyR3aW5uZXInLCB3aW5uZXIpXG4gICAgICApXG4gICAgfVxuICAgIFxuICAgIGlmIChzZXR0aW5ncy5Qb2ludHNXaW5uZXJXaWxsR2V0ID4gMCkge1xuICAgICAgYXdhaXQgcG9pbnRzLmluY3JlbWVudCh3aW5uZXIsIHNldHRpbmdzLlBvaW50c1dpbm5lcldpbGxHZXQpXG4gICAgfVxuICAgIGlmIChzZXR0aW5ncy5Qb2ludHNMb3NlcldpbGxMb3NlPiAwKSB7XG4gICAgICBhd2FpdCBwb2ludHMuZGVjcmVtZW50KHdpbm5lciwgc2V0dGluZ3MuUG9pbnRzTG9zZXJXaWxsTG9zZSlcbiAgICB9XG4gIH1cbiAgXG4gIC8vIHJlbW92ZSBjaGFsbGVuZ2VcbiAgY2hhbGxlbmdlcyA9IGNoYWxsZW5nZXMuZmlsdGVyKGNoID0+ICEoY2gudG8gPT09IHNlbmRlci51c2VyTmFtZSAmJiBjaC5mcm9tID09PSB1c2VyTmFtZSkpO1xuICBhd2FpdCB2YXJpYWJsZS5zYXZlKCdjaGFsbGVuZ2VzJywgY2hhbGxlbmdlcyk7XG4gIHJldHVybiB0cnVlO1xufSBlbHNlIHtcbiAgaWYgKERhdGUubm93KCkgLSBjb29sZG93biA8IHNldHRpbmdzLkNvb2xkb3duVGltZSAqIDEwMDApIHtcbiAgICAvLyB3ZSBoYXZlIGNoYWxsZW5nZSBvbiBjb29sZG93blxuICAgIGNvbnN0IHJlbWFpbmluZ1RpbWUgPSBNYXRoLnJvdW5kKCgoc2V0dGluZ3MuQ29vbGRvd25UaW1lICogMTAwMCkgLSAoRGF0ZS5ub3coKSAtIG5ldyBEYXRlKGNvb2xkb3duKS5nZXRUaW1lKCkpKSAvIDEwMDAgLyA2MCk7XG4gICAgdHdpdGNoLnNlbmRNZXNzYWdlKFxuICAgICAgc2V0dGluZ3MuTWVzc2FnZUNvb2xkb3duXG4gICAgICAgIC5yZXBsYWNlKCckY29tbWFuZCcsIHNldHRpbmdzLmNvbW1hbmQpXG4gICAgICAgIC5yZXBsYWNlKCckY29vbGRvd24nLCByZW1haW5pbmdUaW1lKVxuICAgICAgICAucmVwbGFjZSgnJG1pbnV0ZXNOYW1lJywgbG9jYWxlcy5nZXRMb2NhbGl6ZWROYW1lKHJlbWFpbmluZ1RpbWUsIHNldHRpbmdzLk1lc3NhZ2VNaW51dGVzRm9ybWF0KSlcbiAgICApO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBcbiAgLy8gaWYgd2UgaGF2ZSBjb29sZG93biwgbGV0cyB1cGRhdGUgaXRcbiAgaWYgKGNvb2xkb3duID4gMCkge1xuICAgIGNvb2xkb3duID0gRGF0ZS5ub3coKTtcbiAgICBsb2coJ0Nvb2xkb3duIHVwZGF0ZWQgdG8gJyArIGNvb2xkb3duKTtcbiAgICBhd2FpdCB2YXJpYWJsZS5zYXZlKCdjb29sZG93bicsIGNvb2xkb3duKTtcbiAgfVxuICBcbiAgLy8gcmVtb3ZlIHByZXZpb3VzIGNoYWxsZW5nZXMgYW5kIHVwZGF0ZSByZW1vdmVkQXRcbiAgY2hhbGxlbmdlcyA9IGNoYWxsZW5nZXMuZmlsdGVyKGNoID0+IHtcbiAgICByZXR1cm4gIShjaC5mcm9tID09PSBzZW5kZXIudXNlck5hbWVcbiAgICAgICYmIGNoLnRvID09PSB1c2VyTmFtZSk7XG4gIH0pO1xuICBjaGFsbGVuZ2VzLnB1c2goe1xuICAgICAgdG86IHVzZXJOYW1lLFxuICAgICAgZnJvbTogc2VuZGVyLnVzZXJOYW1lLFxuICAgICAgaXNzdWVkQXQ6IERhdGUubm93KCksXG4gIH0pO1xuICBhd2FpdCB2YXJpYWJsZS5zYXZlKCdjaGFsbGVuZ2VzJywgY2hhbGxlbmdlcyk7XG4gIHR3aXRjaC5zZW5kTWVzc2FnZShcbiAgICBzZXR0aW5ncy5NZXNzYWdlQ2hhbGxlbmdlSXNzdWVkXG4gICAgICAucmVwbGFjZSgnJHVzZXJOYW1lJywgdXNlck5hbWUpXG4gICAgICAucmVwbGFjZSgnJGNvbW1hbmQnLCBzZXR0aW5ncy5jb21tYW5kKVxuICApO1xufVxucmV0dXJuIHRydWU7IiwiZGF0YSI6Int9In0sImNsYXNzIjoicnVuU2NyaXB0IiwiaHRtbCI6InJ1blNjcmlwdCIsInR5cGVub2RlIjoidnVlIiwiaW5wdXRzIjp7ImlucHV0XzEiOnsiY29ubmVjdGlvbnMiOlt7Im5vZGUiOiIxIiwiaW5wdXQiOiJvdXRwdXRfMSJ9XX19LCJvdXRwdXRzIjp7Im91dHB1dF8xIjp7ImNvbm5lY3Rpb25zIjpbXX0sIm91dHB1dF8yIjp7ImNvbm5lY3Rpb25zIjpbXX19LCJwb3NfeCI6MTAzNS40Mjg1NzE0Mjg1NzEzLCJwb3NfeSI6Mjh9fX19fQ==%W3sibmFtZSI6IkNvb2xkb3duQnlwYXNzQnlNb2RzQW5kQ2FzdGVyIiwiY3VycmVudFZhbHVlIjowLCJkZWZhdWx0VmFsdWUiOjAsImRlc2NyaXB0aW9uIjoiSXMgY29vbGRvd24gaWdub3JlZCBieSBtb2RzIGFuZCBjYXN0ZXI/IiwidHlwZSI6Im51bWJlciJ9LHsibmFtZSI6IkNvb2xkb3duRW5hYmxlZCIsImN1cnJlbnRWYWx1ZSI6IjAiLCJkZWZhdWx0VmFsdWUiOjAsImRlc2NyaXB0aW9uIjoiIiwidHlwZSI6Im51bWJlciJ9LHsibmFtZSI6IkNvb2xkb3duVGltZSIsImN1cnJlbnRWYWx1ZSI6MTIwLCJkZWZhdWx0VmFsdWUiOjEyMCwiZGVzY3JpcHRpb24iOiJpbiBzZWNvbmRzIiwidHlwZSI6Im51bWJlciJ9LHsibmFtZSI6Ik1lc3NhZ2VDYW5ub3RGaWdodFdpdGhZb3Vyc2VsZiIsImN1cnJlbnRWYWx1ZSI6IiRzZW5kZXIsIHlvdSBjYW5ub3QgZmlnaHQgd2l0aCB5b3Vyc2VsZiEiLCJkZWZhdWx0VmFsdWUiOiIkc2VuZGVyLCB5b3UgY2Fubm90IGZpZ2h0IHdpdGggeW91cnNlbGYhIiwiZGVzY3JpcHRpb24iOiJVc2VyIHRyaWVzIHRvIGZpZ2h0IHdpdGggdGhlbXNlbGYuIiwidHlwZSI6InN0cmluZyJ9LHsibmFtZSI6Ik1lc3NhZ2VDaGFsbGVuZ2VJc3N1ZWQiLCJjdXJyZW50VmFsdWUiOiIo4LiHJ8yALSfMgSnguIcgJHNlbmRlciB3YW50cyB0byBmaWdodCB5b3UgJHVzZXJOYW1lISBJZiB5b3UgYWNjZXB0LCBzZW5kICRjb21tYW5kICRzZW5kZXIiLCJkZWZhdWx0VmFsdWUiOiIo4LiHJ8yALSfMgSnguIcgJHNlbmRlciB3YW50cyB0byBmaWdodCB5b3UgJHVzZXJOYW1lISBJZiB5b3UgYWNjZXB0LCBzZW5kICRjb21tYW5kICRzZW5kZXIiLCJkZXNjcmlwdGlvbiI6Ik1lc3NhZ2Ugd2hlbiB1c2VyIGlzIGNoYWxsZW5naW5nIG90aGVyIHVzZXIiLCJ0eXBlIjoic3RyaW5nIn0seyJuYW1lIjoiTWVzc2FnZUNvb2xkb3duIiwiY3VycmVudFZhbHVlIjoiJHNlbmRlciwgeW91IGNhbm5vdCB1c2UgJGNvbW1hbmQgZm9yICRjb29sZG93biAkbWludXRlc05hbWUuIiwiZGVmYXVsdFZhbHVlIjoiJHNlbmRlciwgeW91IGNhbm5vdCB1c2UgJGNvbW1hbmQgZm9yICRjb29sZG93biAkbWludXRlc05hbWUuIiwiZGVzY3JpcHRpb24iOiJNZXNzYWdlIGlmIGNoYWxsZW5nZSBpcyBvbiBjb29sZG93biIsInR5cGUiOiJzdHJpbmcifSx7Im5hbWUiOiJNZXNzYWdlTWludXRlc0Zvcm1hdCIsImN1cnJlbnRWYWx1ZSI6Im1pbnV0ZXxtaW51dGVzIiwiZGVmYXVsdFZhbHVlIjoibWludXRlfG1pbnV0ZXMiLCJkZXNjcmlwdGlvbiI6IiIsInR5cGUiOiJzdHJpbmcifSx7Im5hbWUiOiJNZXNzYWdlUmVzdWx0IiwiY3VycmVudFZhbHVlIjoi2akoXuG0l14p27YgJHdpbm5lciBpcyBwcm91ZCB3aW5uZXIgYW5kICRsb3NlciBpcyBzb3JlIGxvc2VyISBXaG8ncyBuZXh0PyIsImRlZmF1bHRWYWx1ZSI6ItmpKF7htJdeKdu2ICR3aW5uZXIgaXMgcHJvdWQgd2lubmVyIGFuZCAkbG9zZXIgaXMgc29yZSBsb3NlciEgV2hvJ3MgbmV4dD8iLCJkZXNjcmlwdGlvbiI6IiIsInR5cGUiOiJzdHJpbmcifSx7Im5hbWUiOiJNZXNzYWdlUmVzdWx0QnJvYWRjYXN0ZXIiLCJjdXJyZW50VmFsdWUiOiLPiCjvvYDiiIfCtCnPiCAkd2lubmVyIGlzIGEgZ29kIGFtb25nIHlvdS4gQmV3YXJlICRsb3NlciEgVGhpcyBmaWdodCB3YXMgZGVjaWRlZCBldmVuIGJlZm9yZSBpdCBzdGFydGVkLiIsImRlZmF1bHRWYWx1ZSI6Is+IKO+9gOKIh8K0Kc+IICR3aW5uZXIgaXMgYSBnb2QgYW1vbmcgeW91LiBCZXdhcmUgJGxvc2VyISBUaGlzIGZpZ2h0IHdhcyBkZWNpZGVkIGV2ZW4gYmVmb3JlIGl0IHN0YXJ0ZWQuIiwiZGVzY3JpcHRpb24iOiJVc2VyIGRhcmUgdG8gY2hhbGxlbmdlIGJyb2FkY2FzdGVyIiwidHlwZSI6InN0cmluZyJ9LHsibmFtZSI6IlBvaW50c0xvc2VyV2lsbExvc2UiLCJjdXJyZW50VmFsdWUiOjAsImRlZmF1bHRWYWx1ZSI6MCwiZGVzY3JpcHRpb24iOiJIb3cgbWFueSBwb2ludHMgd2lsbCBsb3NlciBsb3NlLiIsInR5cGUiOiJudW1iZXIifSx7Im5hbWUiOiJQb2ludHNXaW5uZXJXaWxsR2V0IiwiY3VycmVudFZhbHVlIjowLCJkZWZhdWx0VmFsdWUiOjAsImRlc2NyaXB0aW9uIjoiSG93IG1hbnkgcG9pbnRzIHdpbGwgd2lubmVyIGdldC4iLCJ0eXBlIjoibnVtYmVyIn0seyJuYW1lIjoiVGltZW91dExvc2VyIiwiY3VycmVudFZhbHVlIjo1LCJkZWZhdWx0VmFsdWUiOjUsImRlc2NyaXB0aW9uIjoiaW4gc2Vjb25kcyAoMCA9IGRpc2FibGVkKSIsInR5cGUiOiJudW1iZXIifSx7Im5hbWUiOiJjb21tYW5kIiwiY3VycmVudFZhbHVlIjoiIWZpZ2h0bWUiLCJkZWZhdWx0VmFsdWUiOiIhZmlnaHRtZSIsImRlc2NyaXB0aW9uIjoiQ29tbWFuZCB1c2UgdG8gdHJpZ2dlciBmaWdodCIsInR5cGUiOiJzdHJpbmcifV0='));
*/