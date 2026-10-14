/**
 * Gemini relay: the app calls /ai/v1beta/... with no key; this adds the key kept in the
 * GEMINI_KEY secret and forwards to Google. Course content only passes through, nothing is stored.
 *
 * Who is calling: a student signed in with Google sends their Google token (checked with Google,
 * then remembered for its lifetime); otherwise the device id and the network address count.
 * Each call costs units (light models 1, Flash 3) against a daily allowance per student
 * (DAILY_UNITS, default 400; 150 without Google sign-in) and for everyone together
 * (GLOBAL_DAILY_UNITS, default 20000), so the monthly bill has a ceiling.
 */
const GOOGLE = 'https://generativelanguage.googleapis.com'
const DEFAULT_ORIGINS = 'https://ambroi5e.github.io,http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173'

const cors = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Revise-Device, X-Goog-Upload-Protocol, X-Goog-Upload-Command, X-Goog-Upload-Header-Content-Length, X-Goog-Upload-Header-Content-Type',
  'Access-Control-Expose-Headers': 'x-goog-upload-url, x-revise-left',
  Vary: 'Origin',
})

const json = (status, body, headers) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } })

/** Only the models the app uses: never the paid-only "pro" ones. */
export function modelCost(path) {
  const m = path.match(/models\/([^:/]+)/)?.[1] ?? ''
  if (!m) return 0
  if (!/^(gemini-[\w.-]*flash[\w.-]*|gemini-embedding[\w.-]*|text-embedding[\w.-]*)$/.test(m) || /pro/.test(m)) return -1
  return /lite|embedding/.test(m) ? 1 : 3
}

async function sha(text) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** The Google account behind a token, checked once per token. */
async function googleUser(token, env) {
  const h = await sha(token)
  const hit = await env.DB.prepare('SELECT sub FROM ai_tokens WHERE hash = ? AND exp > ?').bind(h, Date.now()).first()
  if (hit) return hit.sub
  const res = await fetch('https://oauth2.googleapis.com/tokeninfo?access_token=' + encodeURIComponent(token))
  if (!res.ok) return null
  const info = await res.json()
  if (env.GOOGLE_CLIENT_ID && info.aud !== env.GOOGLE_CLIENT_ID && info.azp !== env.GOOGLE_CLIENT_ID) return null
  const sub = info.sub || info.email
  if (!sub) return null
  await env.DB.prepare('INSERT OR REPLACE INTO ai_tokens (hash, sub, exp) VALUES (?, ?, ?)').bind(h, 'g:' + sub, Date.now() + Number(info.expires_in ?? 3000) * 1000).run()
  return 'g:' + sub
}

/** Adds `units` to today's count for `who` and returns the new total. */
async function spend(env, day, who, units) {
  const row = await env.DB.prepare('INSERT INTO ai_usage (day, who, units, calls) VALUES (?, ?, ?, 1) ON CONFLICT(day, who) DO UPDATE SET units = units + excluded.units, calls = calls + 1 RETURNING units')
    .bind(day, who, units).first()
  return row?.units ?? units
}

export async function relay(req, env, url) {
  const origin = req.headers.get('Origin') ?? ''
  const allowed = (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS).split(',').map((o) => o.trim())
  const headers = cors(allowed.includes(origin) ? origin : allowed[0])
  if (req.method === 'OPTIONS') return new Response(null, { headers })
  if (!allowed.includes(origin)) return json(403, { error: { message: 'Origine non autorisée' } }, headers)
  if (!env.GEMINI_KEY) return json(503, { error: { message: 'Relais IA non configuré (GEMINI_KEY manquante)' } }, headers)

  const path = url.pathname.slice('/ai'.length) // /v1beta/... or /upload/v1beta/files
  const okPath = /^\/v1beta\/models(\/[\w.-]+:(generateContent|streamGenerateContent|batchEmbedContents|embedContent|countTokens))?$/.test(path)
    || /^\/v1beta\/files\/[\w-]+$/.test(path) || path === '/upload/v1beta/files'
  if (!okPath) return json(404, { error: { message: 'Chemin non relayé' } }, headers)
  const cost = req.method === 'POST' ? modelCost(path) : 0
  if (cost < 0) return json(403, { error: { message: 'Modèle non autorisé par le relais' } }, headers)

  // Who is calling, and today's allowance.
  const day = new Date().toISOString().slice(0, 10)
  const bearer = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const user = bearer ? await googleUser(bearer, env) : null
  const device = (req.headers.get('X-Revise-Device') ?? '').slice(0, 64)
  const ip = req.headers.get('CF-Connecting-IP') ?? 'unknown'
  const units = path === '/upload/v1beta/files' ? 3 : cost
  let left = ''
  if (units) {
    const limit = Number(user ? env.DAILY_UNITS ?? 400 : env.ANON_DAILY_UNITS ?? 150)
    const global = await spend(env, day, '*', units)
    if (global > Number(env.GLOBAL_DAILY_UNITS ?? 20000)) return json(429, { error: { message: 'Révise a atteint sa limite d’IA du jour pour tout le monde. Réessaie demain.', status: 'RESOURCE_EXHAUSTED', details: [{ reason: 'revise_daily_global' }] } }, headers)
    const mine = await spend(env, day, user ?? 'd:' + (device || ip), units)
    // Without Google sign-in, one network address cannot pile up devices.
    const net = user ? 0 : await spend(env, day, 'ip:' + ip, units)
    if (mine > limit || net > limit * 3) return json(429, { error: { message: user ? 'Tu as atteint ta limite d’IA du jour. Elle revient demain.' : 'Limite d’IA du jour atteinte. Connecte ton compte Google pour en avoir plus, ou réessaie demain.', status: 'RESOURCE_EXHAUSTED', details: [{ reason: 'revise_daily_user' }] } }, headers)
    left = String(Math.max(0, limit - mine))
  }

  const target = new URL(GOOGLE + path)
  for (const [k, v] of url.searchParams) if (k !== 'key') target.searchParams.set(k, v)
  const fwd = new Headers({ 'x-goog-api-key': env.GEMINI_KEY })
  for (const h of ['Content-Type', 'X-Goog-Upload-Protocol', 'X-Goog-Upload-Command', 'X-Goog-Upload-Header-Content-Length', 'X-Goog-Upload-Header-Content-Type']) {
    const v = req.headers.get(h)
    if (v) fwd.set(h, v)
  }
  const res = await fetch(target, { method: req.method, headers: fwd, body: req.method === 'GET' || req.method === 'DELETE' ? undefined : req.body })
  const out = new Headers(headers)
  out.set('Content-Type', res.headers.get('Content-Type') ?? 'application/json')
  if (left) out.set('x-revise-left', left)
  // The upload address Google hands back carries its own upload id: the app sends the file bytes there directly.
  const up = res.headers.get('x-goog-upload-url')
  if (up) out.set('x-goog-upload-url', up)
  return new Response(res.body, { status: res.status, headers: out })
}
