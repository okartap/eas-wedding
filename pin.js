/* Pantalla de acceso: elegir persona (Andrea / Martin) + PIN de 4 cifras. La sesión se mantiene hasta «Cerrar sesión». */
const Lock = {
  sel: null, buf: '', step: 'enter', first: '', msg: '', fails: 0, until: 0, busy: false,
  user() { const u = localStorage.getItem('eas.session'); return USERS.includes(u) ? u : null; },
  pins() { db.profile.pins = db.profile.pins || {}; return db.profile.pins; },
  async hash(pin, salt) { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pin)); return [...new Uint8Array(d)].map(x => x.toString(16).padStart(2, '0')).join(''); },
  enter(u) { localStorage.setItem('eas.session', u); localStorage.setItem('eas.user', u); this.sel = null; this.buf = ''; document.getElementById('lock')?.remove(); refresh(); },
  show() {
    this.sel = null; this.buf = ''; this.step = 'enter'; this.msg = '';
    let el = document.getElementById('lock'); if (!el) { el = document.createElement('div'); el.id = 'lock'; document.body.appendChild(el); }
    el.onclick = e => {
      const b = e.target.closest('[data-k]'); if (!b) return;
      const k = b.dataset.k;
      if (k.startsWith('u:')) { this.sel = k.slice(2); this.buf = ''; this.first = ''; this.msg = ''; this.step = this.pins()[this.sel] ? 'enter' : 'create'; return this.paint(); }
      if (k === 'del') { this.buf = this.buf.slice(0, -1); return this.paint(); }
      this.press(k);
    };
    this.paint();
  },
  title() {
    if (!this.sel) return 'Elige quién eres';
    return this.step === 'create' ? 'Crea tu PIN de 4 cifras' : this.step === 'repeat' ? 'Repite el PIN' : 'Introduce tu PIN';
  },
  paint() {
    const el = document.getElementById('lock'); if (!el) return;
    const dots = [0, 1, 2, 3].map(i => `<span class="ld ${i < this.buf.length ? 'on' : ''}"></span>`).join('');
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map(k => k === '' ? '<span></span>' : `<button type="button" class="lk" data-k="${k}">${k === 'del' ? '⌫' : k}</button>`).join('');
    el.innerHTML = `<div class="lbox"><img class="logo" src="${LOGO}" alt="Ea’s Wedding" onerror="this.remove()">
      <div class="ltiles">${USERS.map(u => `<button type="button" class="lt ${this.sel === u ? 'on' : ''}" data-k="u:${u}"><b>${u[0]}</b><span>${u}</span></button>`).join('')}</div>
      <p class="ltitle">${this.title()}</p>
      ${this.sel ? `<div class="ldots">${dots}</div><p class="lmsg">${this.msg || '&nbsp;'}</p><div class="lpad">${keys}</div>` : ''}</div>`;
  },
  async press(d) {
    if (!this.sel || this.busy || this.buf.length >= 4) return;
    if (Date.now() < this.until) { this.msg = 'Demasiados intentos: espera un momento'; return this.paint(); }
    this.buf += d; this.msg = ''; this.paint();
    if (this.buf.length < 4) return;
    this.busy = true;
    const u = this.sel, pin = this.buf, rec = this.pins()[u];
    try {
      if (rec) {
        if (await this.hash(pin, rec.s) === rec.h) { this.fails = 0; this.busy = false; return this.enter(u); }
        this.fails++; if (this.fails >= 5) { this.until = Date.now() + 30000; this.fails = 0; this.msg = 'Demasiados intentos: espera 30 segundos'; } else this.msg = 'PIN incorrecto';
        this.buf = ''; this.shake();
      } else if (this.step === 'create') { this.first = pin; this.step = 'repeat'; this.buf = ''; }
      else {
        if (pin === this.first) { const s = Math.random().toString(36).slice(2); this.pins()[u] = { s, h: await this.hash(pin, s) }; save(); this.busy = false; return this.enter(u); }
        this.msg = 'No coinciden: empieza de nuevo'; this.step = 'create'; this.buf = ''; this.first = ''; this.shake();
      }
    } catch (e) { this.msg = 'No se pudo comprobar el PIN'; this.buf = ''; }
    this.busy = false; this.paint();
  },
  shake() { setTimeout(() => { const d = document.querySelector('#lock .ldots'); d && d.classList.add('shake'); }, 0); },
  settingsHTML() {
    const me = this.user(), otro = USERS.find(u => u !== me);
    return `<h2>Acceso</h2><p class="hint">Sesión de <b>${esc(me || '—')}</b>. Mientras no cierres sesión, este móvil no vuelve a pedir el PIN.</p>
      <div class="btns" style="margin-top:0"><button class="btn ghost sm" data-act="pinChange">Cambiar mi PIN</button><button class="btn ghost sm" data-act="pinReset">Reiniciar el PIN de ${esc(otro)}</button><button class="btn danger sm" data-act="logout">Cerrar sesión</button></div>`;
  },
  // Con la sincronización activa, el PIN se pide solo después de entrar con el correo y la contraseña compartidos.
  init() { if (!this.user() && (!Sync.enabled || Sync.user)) this.show(); }
};
Object.assign(actions, {
  logout: () => { localStorage.removeItem('eas.session'); if (Sync.enabled) { document.getElementById('lock')?.remove(); Sync.signOut(); } else Lock.show(); },
  pinReset: () => {
    const otro = USERS.find(u => u !== Lock.user());
    if (!confirm('¿Reiniciar el PIN de ' + otro + '? La próxima vez que entre en este móvil tendrá que crear uno nuevo.')) return;
    delete Lock.pins()[otro]; log('Reinició el PIN de ' + otro); save(); toast('PIN de ' + otro + ' reiniciado');
  },
  pinChange: async () => {
    const u = Lock.user(), rec = Lock.pins()[u]; if (!u) return;
    if (rec) { const cur = prompt('Escribe tu PIN actual'); if (cur == null) return; if (await Lock.hash(cur.trim(), rec.s) !== rec.h) return toast('PIN incorrecto'); }
    delete Lock.pins()[u]; save(); localStorage.removeItem('eas.session'); Lock.show();
  }
});
Lock.init();
