// Creates the database if needed, applies the schema, stores the secrets and deploys the Worker.
// Runs in GitHub Actions with CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID set.
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs'

if (!process.env.CLOUDFLARE_API_TOKEN) { console.log('CLOUDFLARE_API_TOKEN absent : rien à déployer.'); process.exit(0) }

const run = (cmd, input) => execSync(cmd, { encoding: 'utf8', input, stdio: [input ? 'pipe' : 'inherit', 'pipe', 'inherit'] })
const NAME = 'revise-serveur'
const find = () => JSON.parse(run('npx wrangler d1 list --json')).find((d) => d.name === NAME)
let db = find()
if (!db) { run(`npx wrangler d1 create ${NAME}`); db = find() }
writeFileSync('wrangler.toml', readFileSync('wrangler.toml', 'utf8').replace(/database_id = ".*"/, `database_id = "${db.uuid}"`))
run(`npx wrangler d1 execute ${NAME} --remote --file=schema.sql`)
for (const s of ['GEMINI_KEY', 'ADMIN_PASSWORD']) if (process.env[s]) run(`npx wrangler secret put ${s}`, process.env[s])
const out = run('npx wrangler deploy')
console.log(out)
const url = out.match(/https:\/\/[\w.-]+\.workers\.dev/)?.[0]
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Serveur de Révise en ligne\n\nAdresse : ${url ?? '(voir le journal)'}\n`)
