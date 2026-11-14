'use strict';
/* Sincronización entre dispositivos con Firebase (Auth + Firestore). Si no hay configuración, no hace nada. */
const Sync = (() => {
  const cfg = window.EAS_FIREBASE || {};
  const COLS = ['bodas', 'tareas', 'contratos', 'notas', 'plantillas', 'historial', 'proveedores', 'tarifas', 'diario'];
  const S = { user: null, status: '', enabled: !!(cfg.apiKey && cfg.projectId && window.firebase) };
  const stable = o => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, x) => (a[x] = v[x], a), {}) : v);
  const clean = o => JSON.parse(JSON.stringify(o));
  let fs, auth, timer; const known = {}, ready = {}; let unsubs = [];

  function quiet() { return /^#(contrato|plantilla|ajustes)/.test(location.hash); }
  function redraw() { if (!quiet()) refresh(); }
  function allReady() { return COLS.every(c => ready[c]) && ready.profile; }

  function listen() {
    stop();
    COLS.forEach(col => {
      unsubs.push(fs.collection(col).onSnapshot(snap => {
        if (!ready[col]) {
          const remote = snap.docs.map(d => d.data());
          if (localStorage.getItem('eas.syncedOnce')) db[col] = remote;
          else { const ids = new Set(remote.map(x => x.id)); db[col] = [...remote, ...(db[col] || []).filter(x => !ids.has(x.id))]; }
          known[col] = {}; remote.forEach(x => known[col][x.id] = stable(x)); ready[col] = true;
        } else {
          snap.docChanges().forEach(ch => {
            const d = ch.doc.data(), arr = db[col], i = arr.findIndex(x => x.id === ch.doc.id);
            if (ch.type === 'removed') { if (i >= 0) arr.splice(i, 1); delete known[col][ch.doc.id]; }
            else { if (i >= 0) arr[i] = d; else arr.push(d); known[col][ch.doc.id] = stable(d); }
          });
        }
        localSave(); if (allReady()) { localStorage.setItem('eas.syncedOnce', '1'); S.status = 'sincronizado'; flush(); } redraw();
      }, err => { S.status = 'sin conexión'; console.warn(err); }));
    });
    unsubs.push(fs.collection('ajustes').doc('profile').onSnapshot(doc => {
      const d = doc.exists ? doc.data() : null;
      if (!ready.profile) { if (d) db.profile = localStorage.getItem('eas.syncedOnce') ? d : Object.assign({}, db.profile, d); known.profile = d ? stable(d) : null; ready.profile = true; }
      else if (d) { db.profile = d; known.profile = stable(d); }
      localSave(); if (allReady()) { localStorage.setItem('eas.syncedOnce', '1'); S.status = 'sincronizado'; flush(); } redraw();
    }, err => console.warn(err)));
  }
  function stop() { unsubs.forEach(u => u()); unsubs = []; COLS.concat('profile').forEach(c => { ready[c] = false; }); }

  function flush() {
    if (!fs || !S.user || !allReady()) return;
    COLS.forEach(col => {
      const k = known[col], ids = new Set();
      (db[col] || []).forEach(item => {
        ids.add(item.id); const c = clean(item), s = stable(c);
        if (k[item.id] !== s) { k[item.id] = s; fs.collection(col).doc(item.id).set(c).catch(() => { delete k[item.id]; S.status = 'sin conexión'; }); }
      });
      Object.keys(k).forEach(id => { if (!ids.has(id)) { delete k[id]; fs.collection(col).doc(id).delete().catch(() => { }); } });
    });
    const p = clean(db.profile || {}), ps = stable(p);
    if (known.profile !== ps) { known.profile = ps; fs.collection('ajustes').doc('profile').set(p).catch(() => { known.profile = null; }); }
  }
  S.push = () => { if (!S.enabled) return; clearTimeout(timer); timer = setTimeout(flush, 500); };

  function loginScreen(msg) {
    let el = document.getElementById('login'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'login';
    el.innerHTML = `<form><div class="center"><img class="logo" src="${LOGO}" alt="Ea’s Wedding" onerror="this.remove()"></div>
      <p class="sub">Inicia sesión para sincronizar los datos</p>
      <label class="f"><span>Correo</span><input type="email" name="e" autocomplete="username" required></label>
      <label class="f"><span>Contraseña</span><input type="password" name="p" autocomplete="current-password" required></label>
      <p class="hint" id="lerr" style="color:var(--danger)">${msg || ''}</p>
      <div class="btns"><button class="btn" type="submit">Entrar</button></div></form>`;
    document.body.appendChild(el);
    el.querySelector('form').onsubmit = e => {
      e.preventDefault(); const f = new FormData(e.target);
      auth.signInWithEmailAndPassword(f.get('e').trim(), f.get('p')).catch(() => { document.getElementById('lerr').textContent = 'Correo o contraseña incorrectos'; });
    };
  }
  S.signOut = () => { try { return auth && auth.signOut(); } catch (e) { } };
  S.init = () => {
    if (!S.enabled) return;
    try {
      firebase.initializeApp(cfg); auth = firebase.auth(); fs = firebase.firestore();
      fs.enablePersistence({ synchronizeTabs: true }).catch(() => { });
    } catch (e) { console.warn(e); S.enabled = false; return; }
    auth.onAuthStateChanged(u => {
      const l = document.getElementById('login'); if (l) l.remove();
      if (u) { S.user = (cfg.users || {})[(u.email || '').toLowerCase()] || u.email; S.status = 'conectando…'; listen(); if (window.Lock) Lock.init(); }
      else { S.user = null; stop(); const k = document.getElementById('lock'); if (k) k.remove(); loginScreen(); }
      refresh();
    });
  };
  S.logout = () => auth && auth.signOut();
  return S;
})();
