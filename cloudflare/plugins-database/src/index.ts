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
	PLUGINS: R2Bucket,
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
	list = [...list, ...fetched.objects.map(o => o.key)];
	if (!fetched.truncated) {
		return (await Promise.all(list.map(async (id) => {
			const readableStream = (await env.PLUGINS.get(id))?.body;
			if (readableStream) {
				const values = JSON.parse(await new Response(readableStream).text());
				// we don't want to send plugin
				delete values.plugin;
				return {
					id,
					...values,
				}
			}
			return { id }
		})))
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
		const url = new URL(request.url);
		const key = url.pathname.slice(1);

		if (uuid.validate(key)) {
			// show plugin
			if (request.method === 'GET') {
				const availableKeys = (await env.PLUGINS.list({ prefix: key })).objects.map(o => o.key).sort();
				if (availableKeys.length > 0) {
					const latestKey = availableKeys[availableKeys.length - 1]
					return new Response((await env.PLUGINS.get(latestKey))?.body, { headers: { 'content-type': 'application/json' }});
				}
				return new Response('{ "error": "Plugin not found" }', { headers: { 'content-type': 'application/json' }});
			}

			// add new vote or replace old one
			if (request.method === 'POST') {
				const availableKeys = (await env.PLUGINS.list({ prefix: key })).objects.map(o => o.key).sort();
				if (availableKeys.length > 0) {
					const latestKey = availableKeys[availableKeys.length - 1]
					const values = JSON.parse(await new Response((await env.PLUGINS.get(latestKey))?.body).text());

					const userId = request.headers.get('Twitch-userId') || '';
					const vote = request.headers.get('Vote') || '';

					if (userId.length > 0 && (vote === '+' || vote === '-')) {
						values.votes = values.votes.filter((o: string) => !o.includes(userId));
						values.votes.push(`${userId}|${vote}`)
						await env.PLUGINS.put(latestKey, JSON.stringify(values));
					}
				}
				return new Response('OK');
			}

			// remove vote
			if (request.method === 'DELETE') {
				const availableKeys = (await env.PLUGINS.list({ prefix: key })).objects.map(o => o.key).sort();
				if (availableKeys.length > 0) {
					const latestKey = availableKeys[availableKeys.length - 1]
					const values = JSON.parse(await new Response((await env.PLUGINS.get(latestKey))?.body).text());

					const userId = request.headers.get('Twitch-userId') || '';
					if (userId.length > 0) {
						values.votes = values.votes.filter(o => !o.includes(userId));
						await env.PLUGINS.put(latestKey, JSON.stringify(values));
					}
					return new Response('OK');
				}
			}

			if (request.method === 'PATCH') {
				const userId = request.headers.get('Twitch-userId') || '';
				const contentType = request.headers.get('content-type') || '';

				if (userId.length > 0) {
					if (contentType.includes('form')) {
						const formData = await request.formData();
						const body: Record<string, string | File> = {};
						for (const entry of formData.entries()) {
							body[entry[0]] = entry[1];
						}
						if (body.plugin && body.description && body.title && body.compatibleWith) {
							// check if plugin exists
							const availableKeys = (await env.PLUGINS.list({ prefix: key })).objects.map(o => o.key).sort();
							if (availableKeys.length > 0) {
								const latestKey = availableKeys[availableKeys.length - 1]
								const version = Number(latestKey.split('|')[1]) + 1;

								if(!body.plugin) {
									return new Response('Missing attribute plugin')
								}

								if(!body.description) {
									return new Response('Missing attribute description')
								}

								if(!body.title) {
									return new Response('Missing attribute title')
								}

								if(!body.compatibleWith) {
									return new Response('Missing attribute compatibleWith')
								}

								// check if previous version have same userId
								const values = JSON.parse(await new Response((await env.PLUGINS.get(latestKey))?.body).text());
								if (values.createdBy === userId) {
									await env.PLUGINS.put(`${key}|${version}`, JSON.stringify({
										description: body.description,
										title: body.title,
										createdBy: userId,
										addedAt: new Date().toISOString(),
										compatibleWith: body.compatibleWith,
										plugin: body.plugin,
										votes: [],
									}));
								} else {
									return new Response('{ "error": "You are trying to update plugin of different user"}', { headers: { 'content-type': 'application/json' }});
								}
							}
						}
					}
				}
				return new Response('OK');
			}
		}

		// default GET
		if (request.method === 'GET') {
			const list = await getFullList(env);
			return new Response(JSON.stringify(list), { headers: { 'content-type': 'application/json' }});
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

					if(!body.plugin) {
						return new Response('Missing attribute plugin')
					}

					if(!body.description) {
						return new Response('Missing attribute description')
					}

					if(!body.title) {
						return new Response('Missing attribute title')
					}

					if(!body.compatibleWith) {
						return new Response('Missing attribute compatibleWith')
					}

					const key = uuid.v4();
					await env.PLUGINS.put(`${key}|1`, JSON.stringify({
						description: body.description,
						title: body.title,
						createdBy: userId,
						addedAt: new Date().toISOString(),
						compatibleWith: body.compatibleWith,
						votes: [],
						plugin: body.plugin,
					}));
			}
			return new Response('OK');

		}
	}
	return new Response();
}
};