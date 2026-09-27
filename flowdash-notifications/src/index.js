/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { createRemoteJWKSet, jwtVerify } from 'jose';

const FIREBASE_KEYS = createRemoteJWKSet(
	new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

function json(data, status = 200, headers = {}) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			...headers,
		},
	});
}

async function getUserId(request, projectId) {
	const authorization = request.headers.get('Authorization') || '';
	const token = authorization.match(/^Bearer (.+)$/i)?.[1];

	if (!token || !projectId) {
		throw new Error('인증 정보가 없습니다.');
	}

	const { payload } = await jwtVerify(token, FIREBASE_KEYS, {
		algorithms: ['RS256'],
		audience: projectId,
		issuer: `https://securetoken.google.com/${projectId}`,
	});

	const nowInSeconds = Math.floor(Date.now() / 1000);

	if (
		typeof payload.sub !== 'string' ||
		!payload.sub ||
		typeof payload.iat !== 'number' ||
		payload.iat > nowInSeconds ||
		typeof payload.auth_time !== 'number' ||
		payload.auth_time > nowInSeconds
	) {
		throw new Error('유효하지 않은 인증 정보입니다.');
	}

	return payload.sub;
}

function parseNotifications(body) {
	if (
		!body ||
		typeof body !== 'object' ||
		typeof body.title !== 'string' ||
		body.title.trim().length === 0 ||
		body.title.trim().length > 120 ||
		!['TODO', 'DOING', 'DONE'].includes(body.status) ||
		!Array.isArray(body.notifications) ||
		body.notifications.length > 10
	) {
		throw new Error('알림 데이터 형식이 올바르지 않습니다.');
	}

	if (body.status === 'DONE') return [];

	const now = Date.now();
	const latestAllowed = now + 366 * 24 * 60 * 60 * 1000;
	const ids = new Set();

	return body.notifications
		.filter((item) => item.sent !== true)
		.map((item) => {
			if (!item || typeof item.id !== 'string' || item.id.length === 0 || item.id.length > 100 || !Number.isSafeInteger(item.notifyAt)) {
				throw new Error('알림 ID 또는 시간이 올바르지 않습니다.');
			}

			if (ids.has(item.id)) {
				throw new Error('중복된 알림 ID가 있습니다.');
			}
			ids.add(item.id);

			return { id: item.id, notifyAt: item.notifyAt };
		})
		.filter((item) => item.notifyAt > now && item.notifyAt <= latestAllowed);
}
async function sendDueNotifications(env) {
	if (!env.ONESIGNAL_API_KEY || !env.ONESIGNAL_APP_ID) {
		throw new Error('OneSignal 설정이 없습니다.');
	}

	const db = env.flowdash_notifications_db;

	const { results } = await db
		.prepare(
			`SELECT id, user_id, todo_id, title
       FROM notifications
       WHERE status = 'pending' AND notify_at <= ?
       ORDER BY notify_at
       LIMIT 25`,
		)
		.bind(Date.now())
		.all();

	for (const notification of results) {
		try {
			// 조회 직후 사용자가 알림을 취소했을 수 있으므로 다시 확인한다.
			const current = await db
				.prepare(
					`SELECT id FROM notifications
           WHERE id = ? AND status = 'pending' AND notify_at <= ?`,
				)
				.bind(notification.id, Date.now())
				.first();

			if (!current) continue;

			const response = await fetch('https://api.onesignal.com/notifications', {
				method: 'POST',
				headers: {
					Authorization: `Key ${env.ONESIGNAL_API_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					app_id: env.ONESIGNAL_APP_ID,
					target_channel: 'push',
					include_aliases: {
						external_id: [notification.user_id],
					},
					headings: { en: 'FlowDash 할 일 알림' },
					contents: { en: notification.title },
					url: 'https://naeun-k.github.io/flowdash/',
					idempotency_key: notification.id,
				}),
			});

			if (!response.ok) {
				const detail = await response.text();
				throw new Error(`OneSignal ${response.status}: ${detail}`);
			}

			const result = await response.json();

			// 대상 브라우저가 구독하지 않은 경우에도 처리 완료로 기록한다.
			// 그 경우 OneSignal 응답의 id가 비어 있을 수 있다.
			if (!result.id) {
				console.warn('구독 중인 대상이 없는 알림:', notification.id, result.errors);
			}

			await db
				.prepare(
					`UPDATE notifications
           SET status = 'sent', sent_at = ?, updated_at = ?
           WHERE id = ? AND status = 'pending'`,
				)
				.bind(Date.now(), Date.now(), notification.id)
				.run();
		} catch (error) {
			// 실패한 건 pending으로 남아 다음 정기 실행 때 재시도한다.
			console.error('알림 발송 실패:', notification.id, error);
		}
	}
}
export default {
	async fetch(request, env) {
		const origin = request.headers.get('Origin');
		const allowedOrigin = env.APP_ORIGIN;

		if (origin && origin !== allowedOrigin) {
			return json({ error: '허용되지 않은 출처입니다.' }, 403);
		}

		const corsHeaders = origin
			? {
					'Access-Control-Allow-Origin': allowedOrigin,
					Vary: 'Origin',
				}
			: {};

		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: {
					...corsHeaders,
					'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
					'Access-Control-Allow-Headers': 'Authorization, Content-Type',
				},
			});
		}

		const path = new URL(request.url).pathname;
		const match = path.match(/^\/todos\/([^/]+)\/notifications$/);

		if (!match || !['PUT', 'DELETE'].includes(request.method)) {
			return json({ error: '요청 경로를 찾을 수 없습니다.' }, 404, corsHeaders);
		}

		let todoId;

		try {
			todoId = decodeURIComponent(match[1]);
		} catch {
			return json({ error: 'Todo ID가 올바르지 않습니다.' }, 400, corsHeaders);
		}

		if (!todoId || todoId.length > 100) {
			return json({ error: 'Todo ID가 올바르지 않습니다.' }, 400, corsHeaders);
		}

		let userId;

		try {
			userId = await getUserId(request, env.FIREBASE_PROJECT_ID);
		} catch {
			return json({ error: '로그인이 필요합니다.' }, 401, corsHeaders);
		}

		try {
			const db = env.flowdash_notifications_db;

			if (request.method === 'DELETE') {
				await db.prepare('DELETE FROM notifications WHERE user_id = ? AND todo_id = ?').bind(userId, todoId).run();

				return json({ ok: true }, 200, corsHeaders);
			}

			const body = await request.json();
			const notifications = parseNotifications(body);
			const now = Date.now();
			const title = body.title.trim();

			// 기존에 전송되지 않은 알림을 제거한 뒤 현재 설정을 반영한다.
			// 이미 전송된 알림은 유지하여 Todo를 다시 저장해도 재발송되지 않게 한다.
			const statements = [
				db
					.prepare(
						`DELETE FROM notifications
             WHERE user_id = ? AND todo_id = ? AND status = 'pending'`,
					)
					.bind(userId, todoId),
			];

			for (const notification of notifications) {
				statements.push(
					db
						.prepare(
							`INSERT INTO notifications (
                id, user_id, todo_id, notification_id,
                title, notify_at, status, sent_at, created_at, updated_at
              )
              VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL, ?, ?)
              ON CONFLICT (user_id, todo_id, notification_id)
              DO UPDATE SET
                title = excluded.title,
                notify_at = excluded.notify_at,
                status = CASE
                  WHEN notifications.title = excluded.title
                   AND notifications.notify_at = excluded.notify_at
                  THEN notifications.status
                  ELSE 'pending'
                END,
				id = CASE
					WHEN notifications.title = excluded.title
					  AND notifications.notify_at = excluded.notify_at
					THEN notifications.id
					ELSE excluded.id
				END,
                sent_at = CASE
                  WHEN notifications.title = excluded.title
                   AND notifications.notify_at = excluded.notify_at
                  THEN notifications.sent_at
                  ELSE NULL
                END,
                updated_at = excluded.updated_at`,
						)
						.bind(crypto.randomUUID(), userId, todoId, notification.id, title, notification.notifyAt, now, now),
				);
			}

			await db.batch(statements);

			return json({ ok: true, scheduled: notifications.length }, 200, corsHeaders);
		} catch (error) {
			if (error instanceof SyntaxError || error.message?.includes('올바르지') || error.message?.includes('중복된')) {
				return json({ error: error.message }, 400, corsHeaders);
			}

			console.error('알림 일정 저장 실패:', error);
			return json({ error: '알림 일정 처리에 실패했습니다.' }, 500, corsHeaders);
		}
	},

	async scheduled(_controller, env) {
		await sendDueNotifications(env);
	},
};
