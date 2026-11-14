/* Subida de dosieres a Google Drive (carpeta propia de la app) + testigo de conexión */
const Net = {
  busy: 0,
  set(on) { this.busy = Math.max(0, this.busy + (on ? 1 : -1)); this.paint(); },
  paint() {
    const d = document.getElementById('net'); if (!d) return;
    const st = !navigator.onLine ? 'off' : (this.busy > 0 || this.swUpdating ? 'upd' : 'on');
    d.className = 'net ' + st;
    d.dataset.label = st === 'off' ? 'Sin conexión: los cambios se guardan en este dispositivo' : st === 'upd' ? 'Actualizando…' : 'Conectado';
  },
  init() {
    const d = document.createElement('div'); d.id = 'net'; d.className = 'net on';
    d.onclick = () => toast(d.dataset.label);
    document.body.appendChild(d); this.paint();
    addEventListener('online', () => this.paint()); addEventListener('offline', () => this.paint());
    if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistration().then(r => {
      if (!r) return;
      const watch = w => { if (!w) return; this.swUpdating = true; this.paint(); w.addEventListener('statechange', () => { if (w.state === 'activated' || w.state === 'redundant') { this.swUpdating = false; this.paint(); } }); };
      if (r.installing) watch(r.installing);
      r.addEventListener('updatefound', () => watch(r.installing));
    });
  }
};

const Drive = {
  token: null, exp: 0,
  loadGIS() {
    return new Promise((ok, ko) => {
      if (window.google?.accounts?.oauth2) return ok();
      const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.onload = ok; s.onerror = () => ko(new Error('No se pudo cargar Google (¿sin conexión?)'));
      document.head.appendChild(s);
    });
  },
  valid() { return !!this.token && Date.now() < this.exp; },
  // Debe llamarse directamente desde un toque del usuario (iOS bloquea la ventana si no).
  auth() {
    if (this.valid()) return Promise.resolve(this.token);
    if (!window.google?.accounts?.oauth2) return this.loadGIS().then(() => { throw new Error('Google se estaba cargando: vuelve a pulsar «Conectar con Google»'); });
    return new Promise((ok, ko) => {
      const c = google.accounts.oauth2.initTokenClient({
        client_id: window.GOOGLE_CLIENT_ID, scope: 'https://www.googleapis.com/auth/drive.file',
        callback: r => { if (r.error) return ko(new Error(r.error === 'access_denied' ? 'Acceso a Drive cancelado' : r.error)); this.token = r.access_token; this.exp = Date.now() + (r.expires_in - 60) * 1000; localStorage.setItem('eas.drive', '1'); ok(this.token); },
        error_callback: e => ko(new Error(e?.type === 'popup_closed' ? 'Ventana de Google cerrada' : e?.type === 'popup_failed_to_open' ? 'El navegador bloqueó la ventana de Google' : 'No se pudo abrir el acceso de Google'))
      });
      c.requestAccessToken({ prompt: localStorage.getItem('eas.drive') ? '' : 'consent' });
    });
  },
  async api(url, opt = {}) {
    if (!this.valid()) throw new Error('Hay que conectar con Google primero');
    const t = this.token;
    const r = await fetch(url, { ...opt, headers: { ...(opt.headers || {}), Authorization: 'Bearer ' + t } });
    if (r.status === 401) { this.token = null; throw new Error('La sesión de Google caducó: inténtalo de nuevo'); }
    if (!r.ok) throw new Error('Drive respondió con error ' + r.status);
    return r;
  },
  async folder() {
    if (db.profile.driveFolder) {
      try { const r = await this.api('https://www.googleapis.com/drive/v3/files/' + db.profile.driveFolder + '?fields=id,trashed'); const j = await r.json(); if (!j.trashed) return j.id; } catch (e) { if (!/error 404/.test(e.message)) throw e; }
    }
    const q = encodeURIComponent("name='Dosieres Ea’s Wedding' and mimeType='application/vnd.google-apps.folder' and trashed=false");
    const j = await (await this.api('https://www.googleapis.com/drive/v3/files?q=' + q + '&fields=files(id)')).json();
    let id = j.files?.[0]?.id;
    if (!id) id = (await (await this.api('https://www.googleapis.com/drive/v3/files?fields=id', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Dosieres Ea’s Wedding', mimeType: 'application/vnd.google-apps.folder' }) })).json()).id;
    db.profile.driveFolder = id; save(); return id;
  },
  async upload(file) {
    Net.set(true);
    try {
      const parent = await this.folder();
      const init = await this.api('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,webViewLink', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': file.type || 'application/octet-stream' }, body: JSON.stringify({ name: file.name, parents: [parent] }) });
      const loc = init.headers.get('Location'); if (!loc) throw new Error('Drive no devolvió la dirección de subida');
      const r = await fetch(loc, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file });
      if (!r.ok) throw new Error('Falló la subida (' + r.status + ')');
      localStorage.setItem('eas.drive', '1');
      return await r.json();
    } finally { Net.set(false); }
  }
};
