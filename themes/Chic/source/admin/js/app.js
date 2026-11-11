// Entry point: load the build's data, pick the backend, then show login, "no access" or the dashboard.
import { createBackend } from './backend.js'
import { createDemo } from './demo.js'
import { renderLogin, renderDenied } from './views/login.js'
import { renderDashboard } from './views/dashboard.js'
import { renderSetPassword } from './views/password.js'
import { el } from './dom.js'

const root = document.getElementById('app')
const params = new URLSearchParams(location.search)
// an invitation or password-reset link arrives as #...&type=invite|recovery; read it before the auth client clears the hash
const arrivedBy = new URLSearchParams(location.hash.slice(1)).get('type')
let choosingPassword = ['invite', 'recovery'].includes(arrivedBy) || (params.get('demo') === 'setpw' && location.hostname === 'localhost')

async function main() {
  const data = await fetch('/admin/data.json').then((r) => r.json())
  const local = ['localhost', '127.0.0.1'].includes(location.hostname)
  const backend = local && params.has('demo') ? createDemo(['in', 'setpw'].includes(params.get('demo'))) : createBackend(data)

  async function show() {
    const session = await backend.session()
    if (!session) return renderLogin(root, { backend, onSignedIn: show })
    if (choosingPassword) return renderSetPassword(root, { backend, onDone: () => { choosingPassword = false; history.replaceState(null, '', location.pathname); show() } })
    const email = session.user && session.user.email
    if (!(await backend.isAdmin())) return renderDenied(root, { email, onSignOut: () => backend.signOut() })
    return renderDashboard(root, { backend, data, email, onSignOut: () => backend.signOut() })
  }

  // react to signing in or out, not to token refreshes
  let signedIn = Boolean(await backend.session())
  backend.onAuth((session) => { if (!choosingPassword && Boolean(session) !== signedIn) { signedIn = Boolean(session); show() } })
  await show()
}

main().catch((e) => root.replaceChildren(el('main', { class: 'center' }, el('div', { class: 'card' }, el('h1', {}, '載入失敗'), el('p', { class: 'muted' }, String(e.message || e))))))
