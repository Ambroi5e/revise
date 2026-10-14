/**
 * Révise server (Cloudflare Worker + D1, free tier).
 * POST /event  ← the app, only for users who agreed at first launch.
 * GET  /admin  → password-protected table of who uses the app (browser basic auth,
 *                password in the ADMIN_PASSWORD secret).
 * /ai/...      → relay to Gemini with the app's own key (GEMINI_KEY secret), so students
 *                need no key. Daily limits per student and for everyone together.
 */
import { relay } from './relay.js'
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
const clip = (v, n) => (typeof v === 'string' ? v.slice(0, n) : null)
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export default {
  async fetch(req, env) {
    const url = new URL(req.url)
    if (url.pathname.startsWith('/ai/')) return relay(req, env, url)
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

    if (url.pathname === '/event' && req.method === 'POST') {
      let b
      try { b = await req.json() } catch { return new Response('bad json', { status: 400, headers: CORS }) }
      if (!clip(b.device, 64) || !['first-launch', 'open', 'pwa-install'].includes(b.event)) return new Response('bad event', { status: 400, headers: CORS })
      await env.DB.prepare('INSERT INTO events (device, name, program, event, day, stats, country, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(clip(b.device, 64), clip(b.name, 60), clip(b.program, 120), b.event, clip(b.day, 10) ?? new Date().toISOString().slice(0, 10),
          JSON.stringify(b.stats ?? {}).slice(0, 500), req.cf?.country ?? null, Date.now())
        .run()
      return new Response('ok', { headers: CORS })
    }

    if (url.pathname === '/admin') {
      const auth = req.headers.get('Authorization') ?? ''
      const pass = auth.startsWith('Basic ') ? atob(auth.slice(6)).split(':').slice(1).join(':') : ''
      if (!env.ADMIN_PASSWORD || pass !== env.ADMIN_PASSWORD) {
        return new Response('Mot de passe requis', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Revise"' } })
      }
      const { results } = await env.DB.prepare(`
        SELECT device,
          (SELECT name FROM events e2 WHERE e2.device = e.device AND name IS NOT NULL ORDER BY at DESC LIMIT 1) AS name,
          (SELECT program FROM events e2 WHERE e2.device = e.device AND program IS NOT NULL AND program != '' ORDER BY at DESC LIMIT 1) AS program,
          (SELECT stats FROM events e2 WHERE e2.device = e.device ORDER BY at DESC LIMIT 1) AS stats,
          MIN(at) AS first, MAX(at) AS last, COUNT(DISTINCT day) AS days,
          SUM(event = 'pwa-install') > 0 AS installed, MAX(country) AS country
        FROM events e GROUP BY device ORDER BY last DESC`).all()
      const d = (t) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
      const week = Date.now() - 7 * 864e5
      const rows = results.map((r) => {
        const s = JSON.parse(r.stats || '{}')
        return `<tr><td><strong>${esc(r.name || 'Anonyme')}</strong><br><small>${esc(r.program)}</small></td><td>${d(r.first)}</td><td>${d(r.last)}</td><td>${r.days}</td><td>${r.installed ? 'oui' : ''}</td><td>${s.subjects ?? ''}</td><td>${s.sheets ?? ''}</td><td>${s.cards ?? ''}</td><td>${esc(r.country)}</td></tr>`
      }).join('')
      const active = results.filter((r) => r.last > week).length
      return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Révise · utilisateurs</title>
<style>body{font:15px system-ui;margin:32px;color:#1d1b2e;background:#fafafe}h1{font-size:28px;margin:0 0 4px}p{color:#555}table{border-collapse:collapse;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px #0001}th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #eee;vertical-align:top}th{font-size:12px;color:#777}small{color:#888}</style>
<h1>Qui utilise Révise</h1><p>${results.length} personne${results.length > 1 ? 's' : ''} · ${active} active${active > 1 ? 's' : ''} ces 7 derniers jours. Seuls ceux qui ont accepté le partage apparaissent.</p>
<table><tr><th>Prénom</th><th>Première fois</th><th>Dernière fois</th><th>Jours d'utilisation</th><th>App installée</th><th>Matières</th><th>Fiches</th><th>Cartes</th><th>Pays</th></tr>${rows}</table>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }
    return new Response('Révise', { status: 404 })
  },
}
