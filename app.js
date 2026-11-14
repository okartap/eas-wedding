'use strict';
/* Ea’s Wedding — PWA de uso personal. Datos guardados en este dispositivo (localStorage). */
const KEY = 'eas.v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => iso(new Date());
const dt = i => new Date(i + 'T12:00:00');
const addDays = (i, n) => { const d = dt(i); d.setDate(d.getDate() + n); return iso(d); };
const addMonths = (i, n) => { const d = dt(i); d.setMonth(d.getMonth() + n); return iso(d); };
const fmtDate = (i, o = { day: 'numeric', month: 'long', year: 'numeric' }) => i ? dt(i).toLocaleDateString('es-ES', o) : '';
const parseNum = v => { if (v === '' || v == null) return NaN; const n = parseFloat(String(v).replace(/\./g, '').replace(',', '.')); return n; };
const fmtMoney = n => isNaN(n) ? '' : n.toLocaleString('de-DE', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }) + ' €';
const USERS = ['Andrea', 'Martin'];
const LOGO = 'icons/logo.png';

/* ---------- Plantilla de contrato por defecto ---------- */
const TPL_BASE = `# CONTRATO DE PRESTACIÓN DE SERVICIOS DE ORGANIZACIÓN Y COORDINACIÓN DE BODA

En {{ciudad}}, a {{fecha_contrato}}.

## REUNIDOS

De una parte, {{planner_nombre}}, con NIF {{planner_nif}} y domicilio en {{planner_direccion}}, que actúa bajo la marca {{marca}} (en adelante, "la Wedding Planner").

De otra parte, {{clientes}}, con domicilio a efectos de notificaciones en {{cliente_direccion}}, correo electrónico {{cliente_email}} y teléfono {{cliente_telefono}} (en adelante, "los Clientes").

Ambas partes se reconocen capacidad legal suficiente para contratar y

## EXPONEN

Que los Clientes desean contratar los servicios de organización y coordinación de su boda, que se celebrará el {{fecha_boda}} en {{lugar_boda}}, y que la Wedding Planner está en disposición de prestarlos, por lo que acuerdan las siguientes

## CLÁUSULAS

## PRIMERA.- Objeto
El presente contrato tiene por objeto la prestación por parte de la Wedding Planner de los siguientes servicios: {{servicio}}

## SEGUNDA.- Honorarios
Los honorarios por los servicios descritos son de {{precio_total}}, importe que {{iva}}.

## TERCERA.- Forma de pago
{{calendario_pagos}}

## CUARTA.- Reserva y cancelación
La reserva abonada a la firma del contrato garantiza la disponibilidad de la fecha y no será reembolsable. Si los Clientes cancelaran el servicio con más de 90 días de antelación a la boda, perderán únicamente la reserva; entre 90 y 30 días, deberán abonar el 50 % de los honorarios; con menos de 30 días, el 100 %.

## QUINTA.- Obligaciones de la Wedding Planner
La Wedding Planner prestará sus servicios con la diligencia profesional debida, coordinará a los proveedores seleccionados y mantendrá informados a los Clientes. Se trata de una obligación de medios y no de resultado. La Wedding Planner no será responsable de los incumplimientos de proveedores contratados directamente por los Clientes.

## SEXTA.- Obligaciones de los Clientes
Los Clientes facilitarán toda la información necesaria, adoptarán las decisiones en los plazos acordados y abonarán los honorarios en las fechas pactadas. Los pagos a proveedores no están incluidos en los honorarios, salvo pacto expreso por escrito.

## SÉPTIMA.- Proveedores y presupuestos
Los presupuestos y contratos con proveedores serán aprobados por los Clientes, que serán quienes los formalicen y abonen, salvo que se acuerde otra cosa por escrito.

## OCTAVA.- Modificación de fecha y fuerza mayor
Cualquier cambio de fecha deberá comunicarse por escrito y quedará sujeto a la disponibilidad de la Wedding Planner. Ninguna de las partes será responsable por incumplimientos derivados de causas de fuerza mayor debidamente acreditadas.

## NOVENA.- Protección de datos
Los datos personales de los Clientes serán tratados por la Wedding Planner con la única finalidad de gestionar la prestación del servicio, conforme al Reglamento (UE) 2016/679 y a la normativa española vigente. Los Clientes podrán ejercer sus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a {{planner_email}}.

## DÉCIMA.- Imagen
Los Clientes autorizan a la Wedding Planner a utilizar imágenes del evento para su promoción profesional, salvo que comuniquen por escrito su oposición.

## UNDÉCIMA.- Legislación y jurisdicción
El presente contrato se rige por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales de {{foro}}.
{{bloque_extra}}
Y en prueba de conformidad, firman el presente contrato por duplicado y a un solo efecto, en el lugar y fecha indicados.`;

const VARS = [
  ['planner_nombre', 'Mi nombre/razón'], ['planner_nif', 'Mi NIF'], ['planner_direccion', 'Mi dirección'], ['planner_email', 'Mi email'], ['planner_telefono', 'Mi teléfono'], ['marca', 'Marca'],
  ['clientes', 'Clientes (según firmantes)'], ['cliente_1_nombre', 'Cliente 1'], ['cliente_1_dni', 'DNI 1'], ['cliente_2_nombre', 'Cliente 2'], ['cliente_2_dni', 'DNI 2'],
  ['cliente_direccion', 'Dirección cliente'], ['cliente_email', 'Email cliente'], ['cliente_telefono', 'Teléfono cliente'],
  ['fecha_boda', 'Fecha boda'], ['lugar_boda', 'Lugar boda'], ['servicio', 'Servicio'], ['precio_total', 'Precio total'], ['reserva', 'Reserva'], ['resto', 'Resto'],
  ['iva', 'IVA'], ['calendario_pagos', 'Calendario pagos'], ['ciudad', 'Ciudad firma'], ['fecha_contrato', 'Fecha contrato'], ['foro', 'Jurisdicción'], ['bloque_extra', 'Cláusulas extra']
];

/* ---------- Hitos de planificación (meses antes de la boda) ---------- */
const HITOS = [
  [-12, 'Reunión inicial y definir presupuesto'], [-12, 'Fijar fecha y visitar espacios'], [-10, 'Cerrar espacio / finca'],
  [-9, 'Reservar fotografía y vídeo'], [-9, 'Reservar catering'], [-8, 'Reservar música / DJ'], [-8, 'Decoración y floristería'],
  [-6, 'Vestido y trajes: primera prueba'], [-6, 'Invitaciones y save the date'], [-4, 'Cerrar lista de invitados'], [-4, 'Prueba y cierre de menú'],
  [-3, 'Transporte y alojamiento'], [-2, 'Distribución de mesas'], [-2, 'Pruebas finales'], [-1, 'Confirmar proveedores y horarios'],
  ['d-14', 'Enviar timeline del día a proveedores'], ['d-7', 'Reunión final con la pareja y pagos finales'], ['d-1', 'Revisión del espacio'],
  ['d0', 'Coordinación del día de la boda'], ['d+7', 'Cierre: cobro final y feedback']
];

/* ---------- Servicios de Ea’s Wedding ---------- */
const HITOS_DIAB = [
  [-1, 'Reunión de inicio y revisión de lo organizado por los novios'], ['d-28', 'Recopilar los contactos de todos los proveedores'],
  ['d-21', 'Crear el timing del evento'], ['d-14', 'Enviar el timing a proveedores y confirmar horarios'],
  ['d-7', 'Reunión final con la pareja'], ['d-1', 'Revisión del espacio'], ['d0', 'Coordinación del día de la boda'], ['d+7', 'Cierre: cobro final y feedback']
];
const SERV_DEF = 'Organización Integral';
const SERVICIOS = {
  'Organización Integral': { hitos: HITOS, items: ['Planificación, diseño y organización desde cero.', 'Estudio personalizado según gustos y estilo de los novios.', 'Búsqueda y selección de proveedores de confianza.', 'Control de presupuesto realista.', 'Creación del timing del evento.', 'Gestión de pagos con los proveedores.', 'Elaboración de planificación cronológica completa.', 'Coordinación total del día B.'] },
  'Coordinación del Día B': { hitos: HITOS_DIAB, items: ['Servicio iniciado un mes antes de la boda.', 'Revisión de todo lo ya organizado por los novios.', 'Recopilación de contactos de todos los proveedores.', 'Creación del timing del evento.', 'Coordinación completa del día B.'] }
};
const servicioTexto = n => { const sv = SERVICIOS[n] || SERVICIOS[SERV_DEF]; return `Servicio de ${n}, que incluye:\n` + sv.items.map(i => '- ' + i).join('\n'); };

/* ---------- Datos ---------- */
function defaults() {
  return { v: 1, profile: { marca: 'Ea’s Wedding' }, bodas: [], tareas: [], contratos: [], notas: [], historial: [], proveedores: [], tarifas: [], diario: [],
    plantillas: [{ id: 'base', nombre: 'Servicios de wedding planner', texto: TPL_BASE }] };
}
let db;
function load() {
  try { const r = localStorage.getItem(KEY); if (r) { db = Object.assign(defaults(), JSON.parse(r)); return; } } catch (e) { }
  db = defaults();
}
function localSave() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { toast('No se pudo guardar (almacenamiento lleno)'); } }
function save() { localSave(); Sync.push(); }
load();
db.historial ||= []; db.proveedores ||= []; db.tarifas ||= []; db.diario ||= [];
function currentUser() { const u = localStorage.getItem('eas.user'); return USERS.includes(u) ? u : 'Andrea'; }
function log(texto) { db.historial.push({ id: uid(), fecha: new Date().toISOString(), usuario: currentUser(), texto }); if (db.historial.length > 400) db.historial = db.historial.slice(-300); }

/* ---------- UI helpers ---------- */
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200); }
function openSheet(html) {
  closeSheet();
  const el = document.createElement('div'); el.className = 'scrim';
  el.innerHTML = `<div class="sheet">${html}</div>`;
  el.addEventListener('click', e => { if (e.target === el) closeSheet(); });
  $('#sheet-root').appendChild(el);
  return $('.sheet', el);
}
function closeSheet() { $('#sheet-root').innerHTML = ''; }
const coupleName = b => [b?.n1, b?.n2].filter(Boolean).join(' y ') || 'Sin nombre';
const bodaById = id => db.bodas.find(b => b.id === id);
function copyText(text) {
  const done = () => toast('Copiado');
  if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done)); }
  else fallbackCopy(text, done);
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta);
  ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('No se pudo copiar'); } ta.remove();
}
function downloadBlob(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}

/* ---------- Estado de vistas ---------- */
let agendaMode = 'lista', showDone = false, calMonth = todayISO().slice(0, 7), selDay = todayISO(), cMode = 'contratos', ce = null;

/* ---------- Router ---------- */
function route() {
  const h = (location.hash || '#inicio').slice(1);
  const [name, a, b] = h.split('/');
  const tab = { inicio: 'inicio', agenda: 'inicio', bodas: 'bodas', boda: 'bodas', contratos: 'contratos', contrato: 'contratos', plantilla: 'contratos', proveedores: 'proveedores', proveedor: 'proveedores', ajustes: 'ajustes' }[name] || 'inicio';
  $$('#nav a').forEach(x => x.classList.toggle('on', x.dataset.tab === tab));
  const v = $('#view');
  const views = { inicio: viewInicio, agenda: viewInicio, bodas: viewBodas, boda: viewBoda, contratos: viewContratos, contrato: viewContrato, plantilla: viewPlantilla, proveedores: viewProveedores, proveedor: viewProveedor, ajustes: viewAjustes };
  (views[name] || viewInicio)(v, a, b);
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
const refresh = () => route();

/* ---------- Delegación de eventos ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) return;
  const act = t.dataset.act, id = t.dataset.id;
  const A = actions[act]; if (A) { e.stopPropagation(); A(id, t, e); }
});

/* ---------- INICIO (agenda + notas de mejora) ---------- */
function allItems() {
  const items = db.tareas.map(t => ({ ...t, kind: 't' }));
  db.bodas.forEach(b => { if (b.fecha) items.push({ id: 'b:' + b.id, kind: 'b', titulo: 'Boda · ' + coupleName(b), fecha: b.fecha, tipo: 'boda', bodaId: b.id }); });
  return items.sort((x, y) => (x.fecha || '9999').localeCompare(y.fecha || '9999') || (x.hora || '99').localeCompare(y.hora || '99'));
}
function rowHTML(it) {
  const b = it.bodaId ? bodaById(it.bodaId) : null;
  const sub = [it.hora, it.kind === 'b' ? '' : (b ? coupleName(b) : ''), it.asignado && it.asignado !== 'Ambos' ? it.asignado : '', TIPO_CORTO[it.tipo] || '', phoneLine(it)].filter(Boolean).join(' · ');
  if (it.kind === 'b') return `<div class="row boda" data-act="openBoda" data-id="${it.bodaId}"><div class="main"><div class="t">${esc(it.titulo)}</div><div class="s">${esc(fmtDate(it.fecha, { weekday: 'long', day: 'numeric', month: 'long' }))}</div></div></div>`;
  return `<div class="row ${it.hecha ? 'done' : ''}" data-act="editTask" data-id="${it.id}">
    <button class="chk ${it.hecha ? 'on' : ''}" data-act="toggleTask" data-id="${it.id}" aria-label="Completar"></button>
    <div class="main"><div class="t">${esc(it.titulo)}</div>${sub ? `<div class="s">${esc(sub)}</div>` : ''}</div></div>`;
}
function dayLabel(d) {
  const t = todayISO();
  if (d === t) return 'Hoy'; if (d === addDays(t, 1)) return 'Mañana';
  return fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' });
}
let dayOpen = {}; // días desplegados (por defecto: Atrasadas y Hoy)
function viewInicio(v) {
  const t = todayISO();
  let body = '';
  if (agendaMode === 'lista') {
    const items = allItems();
    const late = items.filter(i => i.kind === 't' && !i.hecha && i.fecha && i.fecha < t);
    const up = items.filter(i => (i.kind === 'b' ? i.fecha >= t : !i.hecha && i.fecha && i.fecha >= t));
    const nodate = items.filter(i => i.kind === 't' && !i.hecha && !i.fecha);
    const done = items.filter(i => i.kind === 't' && i.hecha);
    const grp = (key, label, list, cls = '') => {
      const open = key in dayOpen ? dayOpen[key] : (key === 'late' || key === t);
      return `<details class="dgroup" ${open ? 'open' : ''} ontoggle="dayOpen['${key}']=this.open"><summary class="group ${cls}">${esc(label)} · ${list.length}</summary>${list.map(rowHTML).join('')}</details>`;
    };
    if (late.length) body += grp('late', 'Atrasadas', late, 'late');
    const byDay = {}; up.forEach(i => (byDay[i.fecha] ||= []).push(i));
    Object.keys(byDay).sort().forEach(d => body += grp(d, dayLabel(d), byDay[d]));
    if (nodate.length) body += grp('nodate', 'Sin fecha', nodate);
    if (showDone && done.length) body += grp('done', 'Completadas', done);
    if (!body) body = `<div class="empty">No hay nada pendiente.<br>Pulsa + para añadir una tarea o cita.</div>`;
    body += `<div class="btns"><button class="btn ghost sm" data-act="toggleDone">${showDone ? 'Ocultar' : 'Mostrar'} completadas</button></div>`;
  } else body = calendarHTML();

  v.innerHTML = `
    <div class="center"><img class="logo" src="${LOGO}" alt="Ea’s Wedding" onerror="this.replaceWith(Object.assign(document.createElement('h1'),{textContent:'Ea’s Wedding'}))"></div>
    <p class="sub">${esc(fmtDate(t, { weekday: 'long', day: 'numeric', month: 'long' }))}</p>
    <div class="seg" style="margin-bottom:10px">${USERS.map(u => `<button class="${currentUser() === u ? 'on' : ''}" data-act="setUser" data-id="${u}">${u}</button>`).join('')}</div>
    <p class="hint" style="margin-top:0">Usuario actual: <b>${esc(currentUser())}</b>${Sync.status ? ' · ' + esc(Sync.status) : ''}</p>
    <form class="quick" id="qa"><input id="qai" placeholder="Ej.: viernes 17:00 reunión" autocomplete="off" enterkeyhint="done"><button class="btn sm" type="submit">Añadir</button></form>
    ${pendBanner()}
    ${diarioGeneralHTML().replace('margin:0 0 18px','margin:4px 0 10px')}
    ${notasHTML().replace('margin-top:26px','margin-top:0;margin-bottom:18px')}
    <div class="seg"><button class="${agendaMode === 'lista' ? 'on' : ''}" data-act="agendaMode" data-id="lista">Lista</button><button class="${agendaMode === 'mes' ? 'on' : ''}" data-act="agendaMode" data-id="mes">Mes</button></div>
    ${body}
    <button class="fab" data-act="newTask" aria-label="Nueva tarea">+</button>`;
}
function calendarHTML() {
  const [y, m] = calMonth.split('-').map(Number);
  const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7, days = new Date(y, m, 0).getDate();
  const items = allItems(); const t = todayISO();
  const by = {}; items.forEach(i => { if (i.fecha && !i.hecha) (by[i.fecha] ||= []).push(i); });
  let cells = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => `<div class="dow">${d}</div>`).join('');
  for (let i = 0; i < offset; i++) cells += '<div></div>';
  for (let d = 1; d <= days; d++) {
    const k = `${y}-${pad(m)}-${pad(d)}`; const its = by[k] || [];
    const wed = its.some(i => i.kind === 'b');
    cells += `<button class="${k === t ? 'today' : ''} ${k === selDay ? 'sel' : ''} ${wed ? 'wed' : ''}" data-act="selDay" data-id="${k}">${d}${its.length && !wed ? '<i></i>' : ''}</button>`;
  }
  const sel = (by[selDay] || []);
  return `<div class="cal-head"><button data-act="calPrev">‹</button><h3>${esc(fmtDate(calMonth + '-01', { month: 'long', year: 'numeric' }))}</h3><button data-act="calNext">›</button></div>
    <div class="cal">${cells}</div>
    <div class="group">${esc(fmtDate(selDay, { weekday: 'long', day: 'numeric', month: 'long' }))}</div>
    ${sel.length ? sel.map(rowHTML).join('') : '<div class="empty" style="padding:14px">Sin eventos este día</div>'}`;
}

/* ---------- Notas de mejora (desplegable en Inicio) ---------- */
let notasOpen = false;
function notasHTML() {
  const list = [...db.notas].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const pend = list.filter(n => !n.hecha).length;
  return `<details class="card" style="margin-top:26px" ${notasOpen ? 'open' : ''} ontoggle="notasOpen=this.open">
    <summary style="cursor:pointer;text-align:center;font-family:var(--serif);font-size:17px;list-style:none">Mejoras y fallos de la app${pend ? ` · ${pend}` : ''}</summary>
    <p class="hint">Apunta lo que falta o no funciona. Luego copia la lista y envíasela a quien programa la app.</p>
    <div class="btns" style="margin-top:6px"><button class="btn sm" data-act="newNota">+ Apuntar</button>${list.length ? `<button class="btn ghost sm" data-act="copyNotas">Copiar todas</button>` : ''}</div>
    ${list.length ? list.map(n => `<div class="row ${n.hecha ? 'done' : ''}" style="cursor:default;align-items:flex-start">
      <button class="chk ${n.hecha ? 'on' : ''}" data-act="toggleNota" data-id="${n.id}" aria-label="Resuelta" style="margin-top:2px"></button>
      <div class="main"><div class="t" style="white-space:pre-wrap;overflow:visible">${esc(n.texto)}</div>
      <div class="s">${n.tipo === 'error' ? 'Fallo' : 'Falta'} · ${esc(n.autor)} · ${esc(fmtDate(n.fecha.slice(0, 10), { day: 'numeric', month: 'short' }))}</div>
      <div style="margin-top:8px;display:flex;gap:8px"><button class="btn ghost sm" data-act="copyNota" data-id="${n.id}">Copiar</button><button class="btn ghost sm" data-act="editNota" data-id="${n.id}">Editar</button><button class="btn danger sm" data-act="delNota" data-id="${n.id}">Borrar</button></div></div></div>`).join('') : `<div class="empty" style="padding:14px">Aún no hay notas</div>`}
  </details>`;
}
const notaLine = n => `- [${n.tipo === 'error' ? 'FALLO' : 'FALTA'}]${n.hecha ? ' (resuelto)' : ''} ${n.texto.replace(/\n/g, ' ')} — ${n.autor}, ${n.fecha.slice(0, 10)}`;
function notaForm(n) {
  const s = openSheet(`<h3>${n ? 'Editar nota' : 'Nueva nota'}</h3>
    <form id="nf"><label class="f"><span>Tipo</span><select name="tipo"><option value="falta" ${n?.tipo !== 'error' ? 'selected' : ''}>Falta algo / mejora</option><option value="error" ${n?.tipo === 'error' ? 'selected' : ''}>Algo funciona mal</option></select></label>
    <label class="f"><span>¿Qué ocurre o qué falta?</span><textarea name="texto" required placeholder="Ej.: En contratos no puedo cambiar el IVA…">${esc(n?.texto || '')}</textarea></label>
    <div class="btns"><button class="btn" type="submit">Guardar</button><button class="btn ghost" type="button" data-act="closeSheet">Cancelar</button></div></form>`);
  $('#nf', s).addEventListener('submit', e => {
    e.preventDefault(); const f = new FormData(e.target);
    if (n) { n.tipo = f.get('tipo'); n.texto = f.get('texto').trim(); }
    else db.notas.push({ id: uid(), tipo: f.get('tipo'), texto: f.get('texto').trim(), autor: currentUser(), fecha: new Date().toISOString(), hecha: false });
    log((n ? 'Editó' : 'Añadió') + ' una nota de mejora'); save(); closeSheet(); notasOpen = true; refresh();
  });
}

/* ---------- Diario (notas de lo hecho, visto o decidido) ---------- */
const DIARIO_TIPOS = ['cita', 'llamada', 'visita']; // al completar estos tipos se pregunta qué se ha hecho o decidido
let diarioOpen = false;
const diarioDe = bodaId => db.diario.filter(e => (e.bodaId || '') === (bodaId || '')).sort((x, y) => y.fecha.localeCompare(x.fecha) || (y.ts || '').localeCompare(x.ts || ''));
function diarioRow(e) {
  const sub = [fmtDate(e.fecha, { weekday: 'short', day: 'numeric', month: 'short' }), e.tarea ? '«' + e.tarea + '»' : '', e.autor].filter(Boolean).join(' · ');
  return `<div class="row" data-act="editDiario" data-id="${e.id}" style="align-items:flex-start"><div class="main"><div class="t" style="white-space:pre-wrap;overflow:visible">${esc(e.texto)}</div><div class="s">${esc(sub)}</div></div></div>`;
}
function diarioHTML(bodaId) {
  const l = diarioDe(bodaId);
  return `${l.length ? l.map(diarioRow).join('') : '<div class="empty" style="padding:10px">Aún no hay notas. Aquí quedará lo que se haga, se vea o se decida.</div>'}
    <div class="btns"><button class="btn sm ghost" data-act="newDiario" data-id="${bodaId || ''}">+ Apuntar</button></div>`;
}
function diarioGeneralHTML() {
  const n = diarioDe('').length;
  return `<details class="card" style="margin:0 0 18px" ${diarioOpen ? 'open' : ''} ontoggle="diarioOpen=this.open">
    <summary style="cursor:pointer;text-align:center;font-family:var(--serif);font-size:17px;list-style:none">Diario general${n ? ` · ${n}` : ''}</summary>
    <p class="hint">Notas que no son de ninguna boda en concreto. Las de cada boda están en su ficha.</p>${diarioHTML('')}</details>`;
}
function diarioForm(e = {}, o = {}) {
  const task = o.task, edit = !!e.id;
  const fixedBoda = task ? (task.bodaId || null) : (o.bodaId || null); // si ya se sabe la boda, no se pregunta
  const bodaSel = edit || fixedBoda === null
    ? `<label class="f"><span>Boda</span><select name="bodaId"><option value="">Ninguna (diario general)</option>${db.bodas.map(b => `<option value="${b.id}" ${(edit ? e.bodaId : '') === b.id ? 'selected' : ''}>${esc(coupleName(b))}</option>`).join('')}</select></label>`
    : `<input type="hidden" name="bodaId" value="${esc(fixedBoda)}">`;
  const ctx = task ? `<p class="hint" style="margin-top:0">Completada: <b>${esc(task.titulo)}</b>${task.bodaId ? ' · ' + esc(coupleName(bodaById(task.bodaId))) : ''}</p>` : '';
  const s = openSheet(`<h3>${task ? '¿Qué se ha hecho o decidido?' : edit ? 'Editar nota' : 'Nueva nota del diario'}</h3>${ctx}
    <form id="df"><label class="f"><span>Nota</span><textarea name="texto" ${task ? '' : 'required'} placeholder="Ej.: Visitamos la finca; les gustó el jardín. Deciden esperar al presupuesto.">${esc(e.texto || '')}</textarea></label>
    <label class="f"><span>Día</span><input type="date" name="fecha" required value="${esc(e.fecha || todayISO())}"></label>${bodaSel}
    <div class="btns"><button class="btn" type="submit">Guardar</button>${edit ? `<button class="btn danger" type="button" data-act="delDiario" data-id="${e.id}">Eliminar</button>` : ''}<button class="btn ghost" type="button" data-act="closeSheet">${task ? 'Omitir' : 'Cancelar'}</button></div></form>`);
  $('#df', s).addEventListener('submit', ev => {
    ev.preventDefault(); const f = new FormData(ev.target); const texto = f.get('texto').trim();
    if (!texto) { closeSheet(); return; } // completando sin escribir nada = omitir
    const bodaId = f.get('bodaId') || '';
    if (edit) Object.assign(e, { texto, fecha: f.get('fecha'), bodaId });
    else db.diario.push({ id: uid(), fecha: f.get('fecha'), ts: new Date().toISOString(), bodaId, tareaId: task?.id || '', tarea: task?.titulo || '', texto, autor: currentUser() });
    log((edit ? 'Editó' : 'Añadió') + ' una nota del diario' + (bodaId ? ' de ' + coupleName(bodaById(bodaId)) : ''));
    save(); closeSheet(); if (!bodaId) diarioOpen = true; toast('Nota guardada'); refresh();
  });
}

/* ---------- Tareas ---------- */
let phoneAfter = false;
function taskForm(t = {}) {
  const otro = USERS.find(u => u !== currentUser());
  const s = openSheet(`<h3>${t.id ? 'Editar' : 'Nueva'} tarea</h3>
    <form id="tf"><label class="f"><span>Título</span><input name="titulo" required value="${esc(t.titulo || '')}"></label>
    <div class="two"><label class="f"><span>Fecha</span><input type="date" name="fecha" value="${esc(t.fecha ?? (t.id ? '' : todayISO()))}"></label>
    <label class="f"><span>Hora</span><input type="time" name="hora" value="${esc(t.hora || '')}"></label></div>
    <div class="two"><label class="f"><span>Tipo</span><select name="tipo">${TIPO_LIST.map(([v, l]) => `<option value="${v}" ${t.tipo === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="f"><span>Asignada a</span><select name="asignado">${['Ambos', ...USERS].map(u => `<option ${((t.asignado || 'Ambos') === u) ? 'selected' : ''}>${u}</option>`).join('')}</select></label></div>
    <label class="f"><span>Boda</span><select name="bodaId"><option value="">— Ninguna —</option>${db.bodas.map(b => `<option value="${b.id}" ${t.bodaId === b.id ? 'selected' : ''}>${esc(coupleName(b))}</option>`).join('')}</select></label>
    <label class="check"><input type="checkbox" name="avisar" ${t.avisar?.length ? 'checked' : ''}> Pedir a ${otro} que también lo añada a su iPhone</label>
    <label class="f"><span>Notas</span><textarea name="notas">${esc(t.notas || '')}</textarea></label>
    <div class="btns"><button class="btn" type="submit">Guardar</button><button class="btn ghost" type="button" data-act="phoneTask">Guardar y añadir a mi iPhone</button>${t.id ? `<button class="btn danger" type="button" data-act="delTask" data-id="${t.id}">Eliminar</button>` : ''}<button class="btn ghost" type="button" data-act="closeSheet">Cancelar</button></div></form>`);
  $('#tf', s).addEventListener('submit', e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    const rec = { titulo: f.titulo.trim(), fecha: f.fecha, hora: f.hora, tipo: f.tipo, asignado: f.asignado, bodaId: f.bodaId, notas: f.notas };
    const avisar = f.avisar ? USERS.filter(u => u !== currentUser()) : [];
    let item, reset = false;
    if (t.id) {
      item = db.tareas.find(x => x.id === t.id);
      const changed = item.fecha !== rec.fecha || (item.hora || '') !== (rec.hora || '') || item.titulo !== rec.titulo;
      Object.assign(item, rec, { avisar });
      if (changed && Object.keys(item.iphone || {}).length) { item.iphone = {}; reset = true; }
    } else { item = { id: uid(), hecha: false, iphone: {}, ...rec, avisar }; db.tareas.push(item); }
    log((t.id ? 'Editó' : 'Creó') + ' la tarea «' + rec.titulo + '»'); save(); closeSheet(); refresh();
    if (reset) toast('Has cambiado la cita: añádela de nuevo al iPhone para actualizarla');
    if (phoneAfter) { phoneAfter = false; addToPhone([item]); }
  });
}

/* ---------- BODAS ---------- */
const ESTADOS = ['Consulta', 'Contratada', 'En planificación', 'Celebrada'];
function viewBodas(v) {
  const list = [...db.bodas].sort((a, b) => (a.fecha || '9999').localeCompare(b.fecha || '9999'));
  v.innerHTML = `<h1>Bodas</h1><p class="sub">${list.length} ${list.length === 1 ? 'proyecto' : 'proyectos'}</p>
    ${list.length ? list.map(b => {
      const ts = db.tareas.filter(t => t.bodaId === b.id), d = ts.filter(t => t.hecha).length;
      return `<div class="card link" data-act="openBoda" data-id="${b.id}"><div class="name">${esc(coupleName(b))}</div>
      <div class="countdown">${esc(b.fecha ? fmtDate(b.fecha) : 'Fecha por definir')}${b.lugar ? ' · ' + esc(b.lugar) : ''}</div>
      <div class="center" style="margin-top:8px"><span class="tag dark">${esc(b.servicio || SERV_DEF)}</span> <span class="tag">${esc(b.estado || 'Consulta')}</span></div>
      ${ts.length ? `<div class="progress"><i style="width:${Math.round(d / ts.length * 100)}%"></i></div>` : ''}</div>`;
    }).join('') : `<div class="empty">Todavía no hay bodas.<br>Pulsa + para crear la primera.</div>`}
    <button class="fab" data-act="newBoda" aria-label="Nueva boda">+</button>`;
}
function bodaForm(b = {}) {
  const f = (n, l, ex = '') => `<label class="f"><span>${l}</span><input name="${n}" value="${esc(b[n] || '')}" ${ex}></label>`;
  const s = openSheet(`<h3>${b.id ? 'Editar boda' : 'Nueva boda'}</h3>
    <form id="bf"><div class="two">${f('n1', 'Nombre 1', 'required')}${f('dni1', 'DNI 1')}</div><div class="two">${f('n2', 'Nombre 2')}${f('dni2', 'DNI 2')}</div>
    <div class="two">${f('email', 'Email', 'type="email"')}${f('tel', 'Teléfono', 'type="tel"')}</div>${f('dir', 'Dirección de los clientes')}
    <div class="two"><label class="f"><span>Fecha de la boda</span><input type="date" name="fecha" value="${esc(b.fecha || '')}"></label>${f('lugar', 'Lugar')}</div>
    <label class="f"><span>Servicio contratado</span><select name="servicio">${Object.keys(SERVICIOS).map(e => `<option ${((b.servicio || SERV_DEF) === e) ? 'selected' : ''}>${e}</option>`).join('')}</select></label>
    <label class="f"><span>Estado</span><select name="estado">${ESTADOS.map(e => `<option ${((b.estado || 'Consulta') === e) ? 'selected' : ''}>${e}</option>`).join('')}</select></label>
    <label class="f"><span>Notas</span><textarea name="notas">${esc(b.notas || '')}</textarea></label>
    ${b.id ? '' : `<label class="check"><input type="checkbox" name="hitos" checked> Crear calendario de hitos automático (según el servicio, si hay fecha)</label>`}
    <div class="btns"><button class="btn" type="submit">Guardar</button><button class="btn ghost" type="button" data-act="closeSheet">Cancelar</button></div></form>`);
  $('#bf', s).addEventListener('submit', e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); const hitos = f.hitos; delete f.hitos;
    let rec;
    if (b.id) { rec = db.bodas.find(x => x.id === b.id); Object.assign(rec, f); }
    else { rec = { id: uid(), ...f }; db.bodas.push(rec); if (hitos && rec.fecha) crearHitos(rec); }
    log((b.id ? 'Editó' : 'Creó') + ' la boda de ' + coupleName(rec)); save(); closeSheet(); location.hash = '#boda/' + rec.id; refresh();
  });
}
function crearHitos(b) {
  const t = todayISO();
  (SERVICIOS[b.servicio] || SERVICIOS[SERV_DEF]).hitos.forEach(([w, titulo]) => {
    let f = typeof w === 'number' ? addMonths(b.fecha, w) : addDays(b.fecha, parseInt(w.slice(1), 10));
    if (f < t) f = t;
    const tipo = /^Reuni/i.test(titulo) ? 'cita' : /visit|prueba|revisi[óo]n del espacio/i.test(titulo) ? 'visita' : 'tarea'; // reuniones y visitas piden nota al completarse
    db.tareas.push({ id: uid(), titulo, fecha: f, hora: '', tipo, asignado: 'Ambos', bodaId: b.id, hecha: false, notas: '' });
  });
}
function viewBoda(v, id) {
  const b = bodaById(id); if (!b) { location.hash = '#bodas'; return; }
  const ts = db.tareas.filter(t => t.bodaId === id).sort((x, y) => (x.fecha || '9999').localeCompare(y.fecha || '9999'));
  const cs = db.contratos.filter(c => c.bodaId === id);
  let cd = '';
  if (b.fecha) { const n = Math.round((dt(b.fecha) - dt(todayISO())) / 864e5); cd = n > 0 ? `Faltan ${n.toLocaleString('de-DE')} días` : n === 0 ? 'Es hoy' : 'Celebrada'; }
  const kv = (k, val) => val ? `<div class="kv"><span>${k}</span><span>${esc(val)}</span></div>` : '';
  v.innerHTML = `<a class="back" href="#bodas">‹ Bodas</a><div class="name" style="font-size:24px">${esc(coupleName(b))}</div>
    <div class="countdown">${esc(b.fecha ? fmtDate(b.fecha) : 'Fecha por definir')}${cd ? ' · ' + cd : ''}</div>
    <div class="center" style="margin:10px 0"><span class="tag dark">${esc(b.servicio || SERV_DEF)}</span> <span class="tag">${esc(b.estado || 'Consulta')}</span></div>
    <div class="card">${kv('Lugar', b.lugar)}${kv('Email', b.email)}${kv('Teléfono', b.tel)}${kv('Dirección', b.dir)}${kv('DNI 1', b.dni1)}${kv('DNI 2', b.dni2)}${kv('Notas', b.notas)}</div>
    <div class="btns"><button class="btn ghost sm" data-act="editBoda" data-id="${id}">Editar</button><button class="btn danger sm" data-act="delBoda" data-id="${id}">Eliminar</button></div>
    <h2>Contratos</h2>${cs.length ? cs.map(contratoRow).join('') : '<div class="empty" style="padding:10px">Sin contratos</div>'}
    <div class="btns"><a class="btn sm" href="#contrato/nuevo/${id}">+ Nuevo contrato</a></div>
    <h2>Diario</h2>${diarioHTML(id)}
    <h2>Tareas</h2>${ts.length ? ts.map(t => rowHTML({ ...t, kind: 't', bodaId: null })).join('') : '<div class="empty" style="padding:10px">Sin tareas</div>'}
    <div class="btns"><button class="btn sm ghost" data-act="newTaskBoda" data-id="${id}">+ Tarea</button>${b.fecha ? `<button class="btn sm ghost" data-act="hitosBoda" data-id="${id}">Añadir hitos automáticos</button>` : ''}</div>`;
}

/* ---------- CONTRATOS ---------- */
function contratoRow(c) {
  const b = bodaById(c.bodaId);
  return `<div class="card link" data-act="openContrato" data-id="${c.id}"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
    <div><div class="name" style="text-align:left;font-size:17px">${esc(coupleName(b))}</div><div class="muted" style="font-size:13px">${esc(fmtDate(c.campos.fecha_contrato, { day: 'numeric', month: 'short', year: 'numeric' }))}${c.campos.precio_total ? ' · ' + esc(c.campos.precio_total) : ''}</div></div>
    <span class="tag ${c.firmado ? 'ok' : ''}">${c.firmado ? 'Firmado por mí' : 'Sin firma'}</span></div></div>`;
}
function viewContratos(v) {
  v.innerHTML = `<h1>Contratos</h1><p class="sub">Genera el PDF con tus datos y los de los clientes</p>
    <div class="seg"><button class="${cMode === 'contratos' ? 'on' : ''}" data-act="cMode" data-id="contratos">Contratos</button><button class="${cMode === 'plantillas' ? 'on' : ''}" data-act="cMode" data-id="plantillas">Plantillas</button></div>
    ${cMode === 'contratos' ? (db.contratos.length ? [...db.contratos].reverse().map(contratoRow).join('') : '<div class="empty">Aún no hay contratos.</div>') + `<div class="btns"><button class="btn" data-act="newContrato">+ Nuevo contrato</button></div>`
      : db.plantillas.map(p => `<div class="card link" data-act="openPlantilla" data-id="${p.id}"><div class="name" style="text-align:left;font-size:17px">${esc(p.nombre)}</div></div>`).join('') + `<div class="btns"><label class="btn" style="cursor:pointer">Importar mi contrato (Word / PDF)<input type="file" accept=".docx,.pdf,.txt,application/pdf" id="impc" hidden></label><button class="btn ghost" data-act="newPlantilla">+ Plantilla en blanco</button></div><p class="hint">Sube uno de tus contratos, convierte los datos de los novios en variables y quedará como plantilla para los siguientes.</p>`}`;
  const imp = $('#impc', v); if (imp) imp.onchange = e => { const f = e.target.files[0]; if (f) importContrato(f); };
}
const loadScript = src => new Promise((res, rej) => { const el = document.createElement('script'); el.src = src; el.onload = res; el.onerror = rej; document.head.appendChild(el); });
function unwrapText(t) {
  const head = l => /^[A-ZÁÉÍÓÚÑ0-9 .,\-–—:()\/]{4,}$/.test(l) || /^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S[ÉE]PTIMA|OCTAVA|NOVENA|D[ÉE]CIMA|UND[ÉE]CIMA|DUOD[ÉE]CIMA|CL[ÁA]USULA)\b/i.test(l) && l.length < 90;
  const out = [];
  t.split('\n').forEach(raw => {
    const l = raw.replace(/\s+/g, ' ').trim();
    if (!l) { if (out.length && out[out.length - 1] !== '') out.push(''); return; }
    const last = out.length ? out[out.length - 1] : '';
    if (last && !/[.:;!?]$/.test(last) && !head(l) && !head(last.replace(/^#+ /, ''))) out[out.length - 1] = last + ' ' + l;
    else out.push(l);
  });
  let first = true;
  return out.map(l => { if (!l) return l; if (head(l) && l.length < 90) { const r = (first ? '# ' : '## ') + l; first = false; return r; } first = false; return l; }).join('\n');
}
async function importContrato(file) {
  toast('Leyendo el documento…');
  try {
    const ext = file.name.split('.').pop().toLowerCase(); let text = '';
    if (ext === 'docx') { await loadScript('vendor/mammoth.browser.min.js'); text = (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value; }
    else if (ext === 'pdf') {
      await loadScript('vendor/pdf.min.js'); pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
      const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      for (let n = 1; n <= pdf.numPages; n++) {
        const tc = await (await pdf.getPage(n)).getTextContent(); let line = '', last = null;
        tc.items.forEach(it => { const y = Math.round(it.transform[5]); if (last !== null && Math.abs(y - last) > 2) { text += line.trim() + '\n'; line = ''; } line += it.str + (it.hasEOL ? ' ' : ''); last = y; });
        text += line.trim() + '\n\n';
      }
    } else text = await file.text();
    text = unwrapText(text.replace(/\r/g, '')).replace(/\n{3,}/g, '\n\n').trim();
    if (!text) { toast('No se pudo leer texto (¿PDF escaneado?)'); return; }
    const p = { id: uid(), nombre: file.name.replace(/\.[^.]+$/, ''), texto: text };
    db.plantillas.push(p); log('Importó el contrato «' + p.nombre + '» como plantilla'); save(); location.hash = '#plantilla/' + p.id;
    toast('Importado. Marca ahora los datos variables');
  } catch (e) { console.error(e); toast('No se pudo leer el archivo'); }
}
function pickBoda() {
  if (!db.bodas.length) { toast('Crea primero una boda'); location.hash = '#bodas'; return; }
  const s = openSheet(`<h3>¿Para qué boda?</h3>${db.bodas.map(b => `<div class="card link" data-act="goNuevoContrato" data-id="${b.id}"><div class="name" style="font-size:17px">${esc(coupleName(b))}</div></div>`).join('')}`);
}
function varsFor(c) {
  const p = db.profile, b = bodaById(c.bodaId) || {}, k = c.campos;
  const total = parseNum(k.precio_total_n), res = parseNum(k.reserva_n);
  const dniTxt = (n, d) => `${n}${d ? ', con DNI ' + d : ''}`;
  const fm = k.firmantes || 'ambos';
  const clientes = (fm === 'ambos' && b.n2) ? `${dniTxt(b.n1, b.dni1)}, y ${dniTxt(b.n2, b.dni2)}`
    : fm === '2' ? `${dniTxt(b.n2, b.dni2)}${b.n1 ? ', que contrata los servicios para la boda que celebrará con ' + b.n1 : ''}`
    : `${dniTxt(b.n1, b.dni1)}${b.n2 ? ', que contrata los servicios para la boda que celebrará con ' + b.n2 : ''}`;
  return {
    clientes, planner_nombre: p.nombre, planner_nif: p.nif, planner_direccion: p.direccion, planner_email: p.email, planner_telefono: p.telefono, marca: p.marca || 'Ea’s Wedding',
    cliente_1_nombre: b.n1, cliente_1_dni: b.dni1, cliente_2_nombre: b.n2, cliente_2_dni: b.dni2, cliente_direccion: b.dir, cliente_email: b.email, cliente_telefono: b.tel,
    fecha_boda: b.fecha ? fmtDate(b.fecha) : '', lugar_boda: b.lugar, servicio: k.servicio, precio_total: fmtMoney(total), reserva: fmtMoney(res), resto: (!isNaN(total) && !isNaN(res)) ? fmtMoney(total - res) : '',
    iva: k.iva, calendario_pagos: k.calendario_pagos, ciudad: k.ciudad, fecha_contrato: k.fecha_contrato ? fmtDate(k.fecha_contrato) : '', foro: k.foro,
    bloque_extra: k.extra && k.extra.trim() ? '\n## DUODÉCIMA.- Condiciones adicionales\n' + k.extra.trim() + '\n' : ''
  };
}
function renderTpl(text, vars) {
  return text.split('\n').map(line => {
    if (/^\s*\{\{bloque_extra\}\}\s*$/.test(line)) return vars.bloque_extra ? vars.bloque_extra.replace(/^\n|\n$/g, '') : null;
    return line.replace(/\{\{(\w+)\}\}/g, (_, n) => (vars[n] != null && String(vars[n]).trim() !== '') ? vars[n] : '________');
  }).filter(l => l !== null).join('\n');
}
function defaultPagos(c) {
  const k = c.campos, t = parseNum(k.precio_total_n), r = parseNum(k.reserva_n);
  if (isNaN(t) || isNaN(r)) return 'La reserva se abonará en el momento de la firma del contrato y el importe restante, hasta 15 días antes de la fecha de la boda.';
  return `La reserva de ${fmtMoney(r)} se abonará en el momento de la firma del contrato. El importe restante, ${fmtMoney(t - r)}, se abonará hasta 15 días antes de la fecha de la boda.`;
}
function viewContrato(v, a, b) {
  if (a === 'nuevo') {
    const bo = bodaById(b); if (!bo) { location.hash = '#contratos'; return; }
    ce = { id: null, bodaId: b, plantillaId: db.plantillas[0].id, firmado: false, dirty: false, pagosDirty: false,
      campos: { servicio_tipo: bo.servicio || SERV_DEF, firmantes: bo.n2 ? 'ambos' : '1', servicio: servicioTexto(bo.servicio || SERV_DEF), precio_total_n: '', reserva_n: '', iva: 'no incluye IVA (se añadirá el 21 %)', ciudad: db.profile.ciudad || '', foro: db.profile.ciudad || '', fecha_contrato: todayISO(), extra: '' } };
    ce.campos.calendario_pagos = defaultPagos(ce); ce.texto = genTexto();
  } else {
    const c = db.contratos.find(x => x.id === a); if (!c) { location.hash = '#contratos'; return; }
    ce = { id: c.id, bodaId: c.bodaId, plantillaId: c.plantillaId, firmado: c.firmado, dirty: true, pagosDirty: true, campos: { ...c.campos }, texto: c.texto };
  }
  drawContrato(v);
}
function genTexto() { const p = db.plantillas.find(x => x.id === ce.plantillaId) || db.plantillas[0]; return renderTpl(p.texto, varsFor(ce)); }
function drawContrato(v) {
  const b = bodaById(ce.bodaId), k = ce.campos, hasSig = !!db.profile.firma;
  const inp = (n, l, ex = '') => `<label class="f"><span>${l}</span><input data-c="${n}" value="${esc(k[n] || '')}" ${ex}></label>`;
  v.innerHTML = `<a class="back" href="#boda/${ce.bodaId}">‹ ${esc(coupleName(b))}</a><h1>${ce.id ? 'Contrato' : 'Nuevo contrato'}</h1><p class="sub">${esc(coupleName(b))}</p>
    <label class="f"><span>Plantilla</span><select id="cpl">${db.plantillas.map(p => `<option value="${p.id}" ${p.id === ce.plantillaId ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select></label>
    ${b.n2 ? `<label class="f"><span>Firman los clientes</span><select data-c="firmantes"><option value="ambos" ${k.firmantes !== '1' && k.firmantes !== '2' ? 'selected' : ''}>Los dos (${esc(b.n1)} y ${esc(b.n2)})</option><option value="1" ${k.firmantes === '1' ? 'selected' : ''}>Solo ${esc(b.n1)}</option><option value="2" ${k.firmantes === '2' ? 'selected' : ''}>Solo ${esc(b.n2)}</option></select></label>` : ''}
    <label class="f"><span>Servicio</span><select data-c="servicio_tipo">${Object.keys(SERVICIOS).map(o => `<option ${((k.servicio_tipo || SERV_DEF) === o) ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
    <label class="f"><span>Descripción del servicio</span><textarea data-c="servicio">${esc(k.servicio)}</textarea></label>
    <div class="two">${inp('precio_total_n', 'Precio total (€)', 'inputmode="decimal"')}${inp('reserva_n', 'Reserva (€)', 'inputmode="decimal"')}</div>
    <label class="f"><span>IVA</span><select data-c="iva">${['no incluye IVA (se añadirá el 21 %)', 'incluye IVA', 'está exento de IVA'].map(o => `<option ${k.iva === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
    <label class="f"><span>Calendario de pagos</span><textarea data-c="calendario_pagos">${esc(k.calendario_pagos)}</textarea></label>
    <div class="two">${inp('ciudad', 'Ciudad de firma')}${inp('foro', 'Jurisdicción (ciudad)')}</div>
    <label class="f"><span>Fecha del contrato</span><input type="date" data-c="fecha_contrato" value="${esc(k.fecha_contrato)}"></label>
    <label class="f"><span>Cláusulas adicionales (opcional)</span><textarea data-c="extra">${esc(k.extra || '')}</textarea></label>
    <h2>Texto del contrato</h2><p class="hint">Se rellena solo. Puedes editarlo a mano antes de generar el PDF.</p>
    <textarea class="doc" id="ctext">${esc(ce.texto)}</textarea>
    <div class="btns" style="margin-top:6px"><button class="btn ghost sm" data-act="regen">Regenerar desde la plantilla</button></div>
    <div class="switch"><div>Incluir mi firma en el PDF<small>${hasSig ? 'Saldrá firmado por ti; los clientes firman a mano o digitalmente.' : 'Aún no has guardado tu firma (Ajustes).'}</small></div>
      <input type="checkbox" id="csign" style="width:26px;height:26px;appearance:auto;-webkit-appearance:checkbox" ${ce.firmado && hasSig ? 'checked' : ''} ${hasSig ? '' : 'disabled'}></div>
    <div class="btns"><button class="btn" data-act="pdfDown">Descargar PDF</button>${navigator.canShare ? '<button class="btn ghost" data-act="pdfShare">Compartir</button>' : ''}</div>
    <div class="btns"><button class="btn ghost" data-act="saveContrato">Guardar contrato</button>${ce.id ? '<button class="btn danger" data-act="delContrato">Eliminar</button>' : ''}</div>`;
  $('#cpl', v).onchange = e => { ce.plantillaId = e.target.value; if (!ce.dirty) syncText(); };
  $('#csign', v).onchange = e => { ce.firmado = e.target.checked; };
  $('#ctext', v).oninput = e => { ce.texto = e.target.value; ce.dirty = true; };
  $$('[data-c]', v).forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
    ce.campos[el.dataset.c] = el.value;
    if (el.dataset.c === 'servicio_tipo') { ce.campos.servicio = servicioTexto(el.value); $('[data-c=servicio]', v).value = ce.campos.servicio; }
    if (el.dataset.c === 'calendario_pagos') ce.pagosDirty = true;
    if ((el.dataset.c === 'precio_total_n' || el.dataset.c === 'reserva_n') && !ce.pagosDirty) { ce.campos.calendario_pagos = defaultPagos(ce); $('[data-c=calendario_pagos]', v).value = ce.campos.calendario_pagos; }
    if (!ce.dirty) syncText();
  }));
}
function syncText() { ce.texto = genTexto(); const t = $('#ctext'); if (t) t.value = ce.texto; }

/* ---------- PDF ---------- */
function buildPDF(text, firma, bo, prof, signers) {
  const { jsPDF } = window.jspdf; const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, H = 297, M = 22, CW = W - 2 * M, LH = 5.3; let y = M + 6;
  const marca = prof.marca || 'Ea’s Wedding';
  const newPage = () => { doc.addPage(); y = M + 6; };
  const need = h => { if (y + h > H - M - 6) newPage(); };
  doc.setFont('times', 'normal');
  text.split('\n').forEach(raw => {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) { y += 2.2; return; }
    if (line.startsWith('# ')) {
      doc.setFont('times', 'bold'); doc.setFontSize(14);
      const ls = doc.splitTextToSize(line.slice(2), CW - 10); need(ls.length * 6.5 + 4);
      ls.forEach(l => { doc.text(l, W / 2, y, { align: 'center' }); y += 6.5; }); y += 4; doc.setFont('times', 'normal'); return;
    }
    if (line.startsWith('## ')) {
      doc.setFont('times', 'bold'); doc.setFontSize(11);
      const ls = doc.splitTextToSize(line.slice(3), CW); need(ls.length * LH + 9); y += 3;
      ls.forEach(l => { doc.text(l, M, y); y += LH; }); doc.setFont('times', 'normal'); return;
    }
    doc.setFont('times', 'normal'); doc.setFontSize(10.5);
    const ls = doc.splitTextToSize(line, CW);
    ls.forEach(l => { need(LH); doc.text(l, M, y); y += LH; });
  });
  // bloque de firmas
  need(62); y += 12;
  const colW = (CW - 14) / 2, x1 = M, x2 = M + colW + 14;
  doc.setFont('times', 'bold'); doc.setFontSize(10.5);
  doc.text('La Wedding Planner', x1, y); doc.text('Los Clientes', x2, y);
  const top = y + 4;
  if (firma) {
    const maxW = colW - 6, maxH = 24; let w = maxW, h = w * firma.h / firma.w; if (h > maxH) { h = maxH; w = h * firma.w / firma.h; }
    doc.addImage(firma.data, 'PNG', x1 + 2, top + (maxH - h), w, h);
  }
  const ly = top + 28; doc.setDrawColor(90); doc.setLineWidth(0.25);
  doc.line(x1, ly, x1 + colW, ly); doc.line(x2, ly, x2 + colW, ly);
  doc.setFont('times', 'normal'); doc.setFontSize(9.5);
  doc.text(prof.nombre || '', x1, ly + 5);
  doc.text('Fdo.: ' + signers.join(' / '), x2, ly + 5, { maxWidth: colW });
  // cabecera y pie en todas las páginas
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i); doc.setFont('times', 'normal'); doc.setFontSize(9); doc.setTextColor(109, 97, 72);
    doc.text(marca.toUpperCase().split('').join(' '), W / 2, 14, { align: 'center' });
    doc.setDrawColor(200); doc.setLineWidth(0.2); doc.line(M + 30, 17, W - M - 30, 17);
    doc.text(`${i} / ${n}`, W / 2, H - 12, { align: 'center' }); doc.setTextColor(0);
  }
  return doc;
}
function contractPDF() {
  const bo = bodaById(ce.bodaId) || {}; const useSig = ce.firmado && db.profile.firma;
  const fm = ce.campos.firmantes || 'ambos';
  const signers = (fm === '2' ? [bo.n2] : fm === '1' || !bo.n2 ? [bo.n1] : [bo.n1, bo.n2]).filter(Boolean);
  const doc = buildPDF(ce.texto, useSig ? db.profile.firma : null, bo, db.profile, signers);
  const nm = `Contrato ${coupleName(bo)} ${ce.campos.fecha_contrato || ''}${useSig ? '' : ' (sin firma)'}.pdf`.replace(/[\\/:*?"<>|]/g, '');
  return { doc, nm };
}
window.__contractPDF = contractPDF; // para pruebas

/* ---------- Plantillas ---------- */
function viewPlantilla(v, id) {
  const p = db.plantillas.find(x => x.id === id); if (!p) { cMode = 'plantillas'; location.hash = '#contratos'; return; }
  v.innerHTML = `<a class="back" href="#contratos">‹ Contratos</a><h1>Plantilla</h1>
    <label class="f"><span>Nombre</span><input id="pn" value="${esc(p.nombre)}"></label>
    <p class="hint">Toca una variable para insertarla donde tengas el cursor. Líneas con # = título; con ## = apartado en negrita.</p>
    <div class="chips">${VARS.map(([n, l]) => `<button data-act="insVar" data-id="${n}">${l}</button>`).join('')}</div>
    <div class="card"><div class="center" style="font-family:var(--serif);margin-bottom:8px">Convertir un dato en variable</div>
      <label class="f"><span>Texto tal como aparece</span><input id="rtext" placeholder="Ej.: Lucía Pérez"></label>
      <label class="f"><span>Es…</span><select id="rvar">${VARS.map(([n, l]) => `<option value="${n}">${l}</option>`).join('')}</select></label>
      <div class="btns" style="margin:6px 0 0"><button class="btn sm" data-act="replVar">Reemplazar en todo el texto</button><button class="btn ghost sm" data-act="autoMine">Sustituir mis datos automáticamente</button></div></div>
    <textarea class="mono" id="pt">${esc(p.texto)}</textarea>
    <div class="btns"><button class="btn" data-act="savePlantilla" data-id="${id}">Guardar</button><label class="btn ghost" style="cursor:pointer">Importar .txt<input type="file" accept=".txt,text/plain" id="pf" hidden></label></div>
    <div class="btns"><button class="btn ghost sm" data-act="dupPlantilla" data-id="${id}">Duplicar</button>${db.plantillas.length > 1 ? `<button class="btn danger sm" data-act="delPlantilla" data-id="${id}">Eliminar</button>` : ''}<button class="btn ghost sm" data-act="resetPlantilla" data-id="${id}">Restaurar texto base</button></div>`;
  $('#pf', v).onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { $('#pt').value = t; toast('Texto importado: pulsa Guardar'); }); };
}

/* ---------- AJUSTES + firma ---------- */
function viewAjustes(v) {
  const p = db.profile, f = (n, l, ex = '', ph = '') => `<label class="f"><span>${l}</span><input data-p="${n}" value="${esc(p[n] || '')}" placeholder="${esc(ph)}" ${ex}></label>`;
  v.innerHTML = `<h1>Ajustes</h1><p class="sub">Tus datos aparecerán en los contratos</p>
    ${f('marca', 'Marca')}${f('nombre', 'Nombre / razón social', '', 'Nombre y apellidos')}<div class="two">${f('nif', 'NIF')}${f('telefono', 'Teléfono', 'type="tel"')}</div>
    ${f('direccion', 'Dirección')}${f('email', 'Email', 'type="email"')}${f('ciudad', 'Ciudad habitual de firma')}
    <h2>Mi firma</h2>
    <div class="sigprev" id="sigprev">${p.firma ? `<img src="${p.firma.data}" alt="Firma">` : '<span class="muted">Sin firma guardada</span>'}</div>
    <div class="btns"><button class="btn sm" data-act="drawSig">Dibujar firma</button><label class="btn ghost sm" style="cursor:pointer">Subir imagen<input type="file" accept="image/*" id="sigf" hidden></label>${p.firma ? '<button class="btn danger sm" data-act="delSig">Quitar</button>' : ''}</div>
    <h2>Sincronización</h2><p class="hint">${Sync.enabled ? (Sync.user ? `Sesión iniciada · ${esc(Sync.status || '')}` : 'Sin sesión') : 'Aún no está configurada: los datos solo están en este dispositivo.'}</p>
    ${Sync.user ? '<div class="btns" style="margin-top:0"><button class="btn ghost sm" data-act="logout">Cerrar sesión</button></div>' : ''}
    <h2>Historial de cambios</h2>
    ${db.historial.length ? [...db.historial].reverse().slice(0, 40).map(h => `<div class="hist"><b>${esc(h.usuario)}</b> · ${esc(h.texto)}<span>${esc(new Date(h.fecha).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}</span></div>`).join('') : '<p class="hint">Aún no hay cambios registrados.</p>'}
    <h2>Aviso en el iPhone</h2><p class="hint">Cómo se envía una cita al Calendario de este móvil.</p>
    <label class="f"><select id="pmethod"><option value="calendar" ${phoneMethod() === 'calendar' ? 'selected' : ''}>Abrir directamente en Calendario</option><option value="share" ${phoneMethod() === 'share' ? 'selected' : ''}>Compartir como archivo</option></select></label>
    <h2>Datos de ejemplo</h2><p class="hint">Crea una boda de prueba con su calendario para ver cómo funciona. Se elimina desde su ficha con «Eliminar».</p>
    <div class="btns" style="margin-top:0"><button class="btn ghost sm" data-act="demoBoda">Crear boda de ejemplo</button></div>
    <h2>Copia de seguridad</h2><p class="hint">Los datos se guardan en este dispositivo. Descarga una copia de vez en cuando.<br>Espacio usado: <b>${Math.min(100, Math.round(JSON.stringify(db).length / 50000))} %</b>${JSON.stringify(db).length > 4000000 ? ' · casi lleno: usa enlaces de Drive en vez de archivos' : ''}</p>
    <div class="btns"><button class="btn ghost sm" data-act="exportDb">Exportar copia</button><label class="btn ghost sm" style="cursor:pointer">Importar copia<input type="file" accept="application/json,.json" id="impf" hidden></label></div>
    <h2>Instalar en el iPhone</h2><p class="hint">Abre la app en Safari → botón Compartir → “Añadir a pantalla de inicio”.</p>`;
  $$('[data-p]', v).forEach(el => el.addEventListener('input', () => { db.profile[el.dataset.p] = el.value; save(); }));
  $('#pmethod', v).onchange = e => localStorage.setItem('eas.phoneMethod', e.target.value);
  $('#sigf', v).onchange = e => { const f = e.target.files[0]; if (f) imageToSig(f); };
  $('#impf', v).onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { const d = JSON.parse(t); if (!d.bodas || !d.plantillas) throw 0; db = Object.assign(defaults(), d); save(); toast('Copia importada'); refresh(); } catch (x) { toast('Archivo no válido'); } }); };
}
function trimCanvas(c) {
  const ctx = c.getContext('2d'), { width: w, height: h } = c, d = ctx.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 <= x0 || y1 <= y0) return null;
  const pd = 6, o = document.createElement('canvas'); o.width = x1 - x0 + 1 + pd * 2; o.height = y1 - y0 + 1 + pd * 2;
  o.getContext('2d').drawImage(c, x0, y0, x1 - x0 + 1, y1 - y0 + 1, pd, pd, x1 - x0 + 1, y1 - y0 + 1);
  return { data: o.toDataURL('image/png'), w: o.width, h: o.height };
}
function setSig(sig) { db.profile.firma = sig; log('Cambió la firma'); save(); refresh(); toast('Firma guardada'); }
function imageToSig(file) {
  const img = new Image(); img.onload = () => {
    const sc = Math.min(1, 900 / img.width), c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, c.width, c.height);
    const im = ctx.getImageData(0, 0, c.width, c.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const l = (d[i] + d[i + 1] + d[i + 2]) / 3; if (l > 235) d[i + 3] = 0; else if (l > 170) d[i + 3] = Math.round((235 - l) / 65 * 255); }
    ctx.putImageData(im, 0, 0); const s = trimCanvas(c); if (s) setSig(s); else toast('No se detecta firma en la imagen');
  }; img.src = URL.createObjectURL(file);
}
function sigPad() {
  const s = openSheet(`<h3>Dibuja tu firma</h3><canvas class="sig" id="sc"></canvas><p class="hint">Firma con el dedo dentro del recuadro.</p>
    <div class="btns"><button class="btn" id="ssave">Guardar</button><button class="btn ghost" id="sclear">Borrar</button><button class="btn ghost" data-act="closeSheet">Cancelar</button></div>`);
  const c = $('#sc', s), r = c.getBoundingClientRect(), dpr = 2; c.width = r.width * dpr; c.height = r.height * dpr;
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr); ctx.lineWidth = 2.4; ctx.lineCap = ctx.lineJoin = 'round'; ctx.strokeStyle = '#14171c';
  let draw = false, last;
  const pos = e => { const b = c.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  c.onpointerdown = e => { draw = true; last = pos(e); c.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.arc(last[0], last[1], 1, 0, 7); ctx.fillStyle = '#14171c'; ctx.fill(); };
  c.onpointermove = e => { if (!draw) return; const p = pos(e); ctx.beginPath(); ctx.moveTo(...last); ctx.lineTo(...p); ctx.stroke(); last = p; };
  c.onpointerup = c.onpointercancel = () => { draw = false; };
  $('#sclear', s).onclick = () => ctx.clearRect(0, 0, c.width, c.height);
  $('#ssave', s).onclick = () => { const sg = trimCanvas(c); if (!sg) return toast('Dibuja primero tu firma'); closeSheet(); setSig(sg); };
}

/* ---------- Acciones ---------- */
const actions = {
  closeSheet, setUser: id => { localStorage.setItem('eas.user', id); refresh(); },
  agendaMode: id => { agendaMode = id; refresh(); }, toggleDone: () => { showDone = !showDone; refresh(); },
  selDay: id => { selDay = id; refresh(); },
  calPrev: () => { calMonth = addMonths(calMonth + '-01', -1).slice(0, 7); refresh(); }, calNext: () => { calMonth = addMonths(calMonth + '-01', 1).slice(0, 7); refresh(); },
  newTask: () => taskForm(agendaMode === 'mes' ? { fecha: selDay } : {}), newTaskBoda: id => taskForm({ bodaId: id }),
  editTask: id => taskForm(db.tareas.find(t => t.id === id)),
  toggleTask: id => { const t = db.tareas.find(x => x.id === id); t.hecha = !t.hecha; log((t.hecha ? 'Completó' : 'Reabrió') + ' la tarea «' + t.titulo + '»'); save(); refresh(); if (t.hecha && DIARIO_TIPOS.includes(t.tipo)) diarioForm({}, { task: t }); },
  delTask: id => { const t = db.tareas.find(x => x.id === id); log('Eliminó la tarea «' + t?.titulo + '»'); db.tareas = db.tareas.filter(t => t.id !== id); save(); closeSheet(); refresh(); },
  newDiario: id => diarioForm({}, { bodaId: id || '' }), editDiario: id => diarioForm(db.diario.find(e => e.id === id), {}),
  delDiario: id => { if (!confirm('¿Borrar esta nota del diario?')) return; db.diario = db.diario.filter(e => e.id !== id); log('Borró una nota del diario'); save(); closeSheet(); refresh(); },
  newNota: () => notaForm(), editNota: id => notaForm(db.notas.find(n => n.id === id)),
  toggleNota: id => { const n = db.notas.find(x => x.id === id); n.hecha = !n.hecha; save(); notasOpen = true; refresh(); },
  delNota: id => { if (!confirm('¿Borrar esta nota?')) return; db.notas = db.notas.filter(n => n.id !== id); save(); notasOpen = true; refresh(); },
  copyNota: id => copyText(notaLine(db.notas.find(n => n.id === id))),
  copyNotas: () => copyText(`Mejoras y fallos de Ea’s Wedding\n${db.notas.filter(n => !n.hecha).map(notaLine).join('\n')}`),
  newBoda: () => bodaForm(), openBoda: id => { location.hash = '#boda/' + id; }, editBoda: id => bodaForm(bodaById(id)),
  delBoda: id => { if (!confirm('¿Eliminar esta boda con sus tareas, contratos y diario?')) return; log('Eliminó la boda de ' + coupleName(bodaById(id))); db.bodas = db.bodas.filter(b => b.id !== id); db.tareas = db.tareas.filter(t => t.bodaId !== id); db.contratos = db.contratos.filter(c => c.bodaId !== id); db.diario = db.diario.filter(e => e.bodaId !== id); save(); location.hash = '#bodas'; },
  demoBoda: () => {
    const rec = { id: uid(), n1: 'Laura (ejemplo)', dni1: '', n2: 'Carlos (ejemplo)', dni2: '', email: 'ejemplo@correo.com', tel: '600 000 000', dir: 'Calle Ejemplo 1, Murcia',
      fecha: addMonths(todayISO(), 5), lugar: 'Finca de ejemplo', servicio: 'Organización Integral', estado: 'Contratada', notas: 'Boda de prueba. Se puede eliminar.' };
    db.bodas.push(rec); crearHitos(rec);
    db.tareas.push({ id: uid(), titulo: 'Llamar a Laura y Carlos (ejemplo)', fecha: addDays(todayISO(), 2), hora: '10:30', tipo: 'cita', asignado: 'Andrea', bodaId: rec.id, hecha: false, notas: '' });
    log('Creó la boda de ejemplo'); save(); toast('Boda de ejemplo creada'); location.hash = '#boda/' + rec.id;
  },
  hitosBoda: id => { crearHitos(bodaById(id)); save(); toast('Hitos añadidos'); refresh(); },
  cMode: id => { cMode = id; refresh(); }, newContrato: pickBoda, goNuevoContrato: id => { closeSheet(); location.hash = '#contrato/nuevo/' + id; },
  openContrato: id => { location.hash = '#contrato/' + id; },
  regen: () => { if (ce.dirty && !confirm('Se perderán tus ediciones manuales del texto. ¿Continuar?')) return; ce.dirty = false; syncText(); },
  pdfDown: () => { try { const { doc, nm } = contractPDF(); doc.save(nm); } catch (e) { toast('Error al generar el PDF'); console.error(e); } },
  pdfShare: async () => { try { const { doc, nm } = contractPDF(); const file = new File([doc.output('blob')], nm, { type: 'application/pdf' }); if (navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: nm }); else doc.save(nm); } catch (e) { if (e.name !== 'AbortError') toast('No se pudo compartir'); } },
  saveContrato: () => {
    const rec = { id: ce.id || uid(), bodaId: ce.bodaId, plantillaId: ce.plantillaId, firmado: !!(ce.firmado && db.profile.firma), campos: { ...ce.campos }, texto: ce.texto };
    if (ce.id) db.contratos[db.contratos.findIndex(c => c.id === ce.id)] = rec; else { db.contratos.push(rec); ce.id = rec.id; }
    log((ce.id ? 'Guardó' : 'Creó') + ' un contrato de ' + coupleName(bodaById(ce.bodaId))); save(); toast('Contrato guardado'); location.hash = '#boda/' + ce.bodaId;
  },
  delContrato: () => { if (!confirm('¿Eliminar este contrato?')) return; log('Eliminó un contrato de ' + coupleName(bodaById(ce.bodaId))); db.contratos = db.contratos.filter(c => c.id !== ce.id); save(); location.hash = '#boda/' + ce.bodaId; },
  openPlantilla: id => { location.hash = '#plantilla/' + id; },
  newPlantilla: () => { const p = { id: uid(), nombre: 'Nueva plantilla', texto: TPL_BASE }; db.plantillas.push(p); save(); location.hash = '#plantilla/' + p.id; },
  savePlantilla: id => { const p = db.plantillas.find(x => x.id === id); p.nombre = $('#pn').value.trim() || 'Plantilla'; p.texto = $('#pt').value; log('Guardó la plantilla «' + p.nombre + '»'); save(); toast('Plantilla guardada'); },
  dupPlantilla: id => { const p = db.plantillas.find(x => x.id === id); const n = { ...p, id: uid(), nombre: p.nombre + ' (copia)' }; db.plantillas.push(n); save(); location.hash = '#plantilla/' + n.id; },
  delPlantilla: id => { if (!confirm('¿Eliminar esta plantilla?')) return; log('Eliminó una plantilla'); db.plantillas = db.plantillas.filter(p => p.id !== id); save(); cMode = 'plantillas'; location.hash = '#contratos'; },
  resetPlantilla: id => { if (!confirm('Se sustituirá el texto por el modelo base.')) return; $('#pt').value = TPL_BASE; },
  replVar: () => { const t = $('#pt'), lit = $('#rtext').value.trim(); if (!lit) return toast('Escribe el texto a reemplazar'); const n = t.value.split(lit).length - 1; if (!n) return toast('No aparece en el texto'); t.value = t.value.split(lit).join('{{' + $('#rvar').value + '}}'); $('#rtext').value = ''; toast(n + (n === 1 ? ' reemplazo' : ' reemplazos') + ': pulsa Guardar'); },
  autoMine: () => { const t = $('#pt'), p = db.profile; let n = 0; [['nombre', 'planner_nombre'], ['nif', 'planner_nif'], ['direccion', 'planner_direccion'], ['email', 'planner_email'], ['telefono', 'planner_telefono']].forEach(([k, v]) => { const lit = (p[k] || '').trim(); if (lit && t.value.includes(lit)) { n += t.value.split(lit).length - 1; t.value = t.value.split(lit).join('{{' + v + '}}'); } }); toast(n ? n + ' datos sustituidos: pulsa Guardar' : 'No se han encontrado tus datos (revisa Ajustes)'); },
  logout: () => Sync.logout(),
  insVar: id => { const t = $('#pt'), a = t.selectionStart ?? t.value.length, b = t.selectionEnd ?? a, ins = `{{${id}}}`; t.value = t.value.slice(0, a) + ins + t.value.slice(b); t.focus(); t.selectionStart = t.selectionEnd = a + ins.length; },
  drawSig: sigPad, delSig: () => { delete db.profile.firma; save(); refresh(); },
  exportDb: () => downloadBlob(new Blob([JSON.stringify(db, null, 1)], { type: 'application/json' }), `eas-wedding-copia-${todayISO()}.json`)
};

/* ---------- Añadido rápido y aviso en el iPhone ---------- */
const fold = s => String(s ?? '').replace(/[áÁ]/g, 'a').replace(/[éÉ]/g, 'e').replace(/[íÍ]/g, 'i').replace(/[óÓ]/g, 'o').replace(/[úÚ]/g, 'u').replace(/[ñÑ]/g, 'n').toLowerCase();
const MESES_N = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS_N = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
const TIPO_LIST = [['tarea', 'Tarea'], ['cita', 'Reunión / cita'], ['llamada', 'Llamada'], ['visita', 'Visita / prueba'], ['pago', 'Pago / cobro']];
const TIPOS = Object.fromEntries(TIPO_LIST);
const TIPO_CORTO = { cita: 'Cita', llamada: 'Llamada', visita: 'Visita', pago: 'Pago' };
function parseQuick(text) {
  let o = ' ' + text.trim() + ' ', f = fold(o), fecha = '', hora = '', m;
  const cut = x => { o = o.slice(0, x.index) + ' ' + o.slice(x.index + x[0].length); f = f.slice(0, x.index) + ' ' + f.slice(x.index + x[0].length); };
  const t = todayISO();
  // Hora
  let hh = null, mm = 0, part = '', conLas = false;
  if ((m = f.match(/\b(?:a|sobre) las?\s+(\d{1,2})(?:[:.h](\d{2}))?(?:\s*h\b|\s*horas)?(?:\s+de la\s+(manana|tarde|noche|madrugada))?/))) { hh = +m[1]; mm = +(m[2] || 0); part = m[3] || ''; conLas = true; cut(m); }
  else if ((m = f.match(/\b(\d{1,2})[:.](\d{2})(?:\s*h\b|\s*horas)?(?:\s+de la\s+(manana|tarde|noche))?/))) { hh = +m[1]; mm = +m[2]; part = m[3] || ''; cut(m); }
  else if ((m = f.match(/\b(\d{1,2})\s?h\b(?:\s+de la\s+(manana|tarde|noche))?/))) { hh = +m[1]; part = m[2] || ''; cut(m); }
  if (hh !== null && hh <= 23 && mm <= 59) {
    if ((part === 'tarde' || part === 'noche') && hh < 12) hh += 12;
    else if (!part && conLas && hh >= 1 && hh <= 7) hh += 12;
    hora = pad(hh) + ':' + pad(mm);
  }
  // Fecha
  const mk = (d, mo, y) => { const dd = new Date(y, mo - 1, d); return dd.getMonth() === mo - 1 && dd.getDate() === d ? iso(dd) : ''; };
  const fill = (d, mo, y) => { if (d > 31 || mo > 12 || d < 1 || mo < 1) return ''; let yy = y ? (y < 100 ? 2000 + y : y) : dt(t).getFullYear(); let r = mk(d, mo, yy); if (r && !y && r < t) r = mk(d, mo, yy + 1); return r; };
  if ((m = f.match(/\bpasado manana\b/))) { fecha = addDays(t, 2); cut(m); }
  else if ((m = f.match(/\bmanana\b/))) { fecha = addDays(t, 1); cut(m); }
  else if ((m = f.match(/\bhoy\b/))) { fecha = t; cut(m); }
  else if ((m = f.match(/\b(?:el proximo |el |este |proximo )?(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/))) {
    const rest = f.slice(m.index + m[0].length), nm = rest.match(new RegExp('^\\s+(\\d{1,2})(?!\\d)(?![:.\\/]\\d)(?!\\s?h\\b)(?!-)(?:\\s+de\\s+(' + MESES_N.join('|') + '))?'));
    if (nm && +nm[1] >= 1 && +nm[1] <= 31) {
      const day = +nm[1]; let r = '';
      if (nm[2]) r = fill(day, MESES_N.indexOf(nm[2]) + 1, 0);
      else { const base = dt(t); for (let k = 0; k < 12 && !r; k++) { const cand = mk(day, base.getMonth() + 1 + k > 12 ? base.getMonth() + 1 + k - 12 : base.getMonth() + 1 + k, base.getFullYear() + (base.getMonth() + 1 + k > 12 ? 1 : 0)); if (cand && cand >= t) r = cand; } }
      if (r) { fecha = r; cut({ index: m.index, 0: f.slice(m.index, m.index + m[0].length + nm[0].length) }); }
    }
    if (!fecha) { let diff = (DIAS_N.indexOf(m[1]) - dt(t).getDay() + 7) % 7; if (diff === 0) diff = 7; fecha = addDays(t, diff); cut(m); }
  }
  else if ((m = f.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/)) && (fecha = fill(+m[1], +m[2], m[3] ? +m[3] : 0))) cut(m);
  else if ((m = f.match(new RegExp('\\b(?:(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)\\s+)?(?:el )?(\\d{1,2}) de (' + MESES_N.join('|') + ')(?: de (\\d{4}))?\\b'))) && (fecha = fill(+m[1], MESES_N.indexOf(m[2]) + 1, m[3] ? +m[3] : 0))) cut(m);
  else if ((m = f.match(/\b(?:dentro de|en) (\d+) (dias?|semanas?|meses?)\b/))) { const n = +m[1]; fecha = /^d/.test(m[2]) ? addDays(t, n) : /^s/.test(m[2]) ? addDays(t, n * 7) : addMonths(t, n); cut(m); }
  else if ((m = f.match(/\bla semana que viene\b/))) { fecha = addDays(t, 7); cut(m); }
  else fecha = '';
  let titulo = o.replace(/\s+/g, ' ').trim()
    .replace(/^(?:[,.:;\-–\s]|(?:el|la|para|a|de|del|dia|día|que)\s)+/i, '').replace(/(?:[,.:;\-–\s]|\s(?:el|la|para|a|de|del|dia|día|que|en))+$/i, '').trim();
  if (!titulo) return null;
  titulo = titulo.charAt(0).toUpperCase() + titulo.slice(1);
  const ft = fold(titulo);
  const tipo = /\b(pago|pagar|cobro|cobrar|factura|transferencia)\b/.test(ft) ? 'pago' : /\b(llamar|llamada|telefonear)\b/.test(ft) ? 'llamada' : /\b(visita|visitar|prueba|probar|degustacion)\b/.test(ft) ? 'visita' : (/\b(reunion|cita|quedar|quedada)\b/.test(ft) || hora) ? 'cita' : 'tarea';
  return { titulo, fecha: fecha || t, sinFecha: !fecha, hora, tipo };
}
let qPhone = false;
function quickSheet(p) {
  const otro = USERS.find(u => u !== currentUser());
  const s = openSheet(`<h3>Añadir a la agenda</h3><form id="qf">
    <label class="f"><span>Qué</span><input name="titulo" required value="${esc(p.titulo)}"></label>
    <div class="two"><label class="f"><span>Día</span><input type="date" name="fecha" required value="${esc(p.fecha)}"></label>
    <label class="f"><span>Hora</span><input type="time" name="hora" value="${esc(p.hora)}"></label></div>
    <p class="hint" style="margin-top:-4px">${p.sinFecha ? 'No indicaste día: he puesto hoy. ' : ''}Sin hora, será de todo el día. Toca cualquier campo para cambiarlo.</p>
    <label class="f"><span>Tipo</span><select name="tipo">${TIPO_LIST.map(([v, l]) => `<option value="${v}" ${p.tipo === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="check"><input type="checkbox" name="avisar"> Pedir a ${otro} que también lo añada a su iPhone</label>
    <div class="btns"><button class="btn" type="submit">Guardar</button><button class="btn ghost" type="button" data-act="qaSavePhone">Guardar y añadir a mi iPhone</button><button class="btn ghost" type="button" data-act="closeSheet">Cancelar</button></div></form>`);
  $('#qf', s).addEventListener('submit', e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    const rec = { id: uid(), hecha: false, titulo: f.titulo.trim(), fecha: f.fecha, hora: f.hora, tipo: f.tipo, asignado: 'Ambos', bodaId: '', notas: '', avisar: f.avisar ? USERS.filter(u => u !== currentUser()) : [], iphone: {} };
    db.tareas.push(rec); log('Creó la tarea «' + rec.titulo + '»'); save(); closeSheet(); refresh();
    if (qPhone) { qPhone = false; addToPhone([rec]); }
  });
}
document.addEventListener('submit', e => {
  if (e.target.id !== 'qa') return; e.preventDefault();
  const v = $('#qai').value.trim(); if (!v) return;
  const p = parseQuick(v); if (!p) return toast('Escribe también qué hay que hacer');
  quickSheet(p);
});
const phoneLine = t => {
  if (!t || !t.titulo || t.kind === 'b') return '';
  const ya = USERS.filter(u => t.iphone?.[u]), falta = (t.avisar || []).filter(u => !t.iphone?.[u]);
  return [ya.length ? 'En el iPhone de ' + ya.join(' y ') : '', falta.length ? 'falta ' + falta.join(' y ') : ''].filter(Boolean).join(' · ');
};
const pendingPhone = () => { const me = currentUser(), t = todayISO(); return db.tareas.filter(x => !x.hecha && x.fecha && x.fecha >= t && (x.avisar || []).includes(me) && !x.iphone?.[me]); };
function pendBanner() {
  const p = pendingPhone(); if (!p.length) return '';
  return `<div class="card" style="text-align:center"><div style="font-size:15px">Tienes <b>${p.length}</b> ${p.length === 1 ? 'cita pendiente' : 'citas pendientes'} de añadir a tu iPhone</div>
    <div class="btns" style="margin:10px 0 0"><button class="btn sm" data-act="phoneAllPending">Añadir a mi iPhone</button></div></div>`;
}
const icsEsc = s => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const icsFold = l => { const out = []; while (l.length > 60) { out.push(l.slice(0, 60)); l = ' ' + l.slice(60); } out.push(l); return out.join('\r\n'); };
function icsFor(items) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const compact = i => i.replace(/-/g, '');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ea’s Wedding//ES', 'CALSCALE:GREGORIAN'];
  items.forEach(t => {
    const b = t.bodaId ? bodaById(t.bodaId) : null;
    const desc = [b ? 'Boda: ' + coupleName(b) : '', t.notas].filter(Boolean).join('\n');
    L.push('BEGIN:VEVENT', 'UID:' + t.id + '@easwedding', 'DTSTAMP:' + stamp, 'SUMMARY:' + icsEsc(t.titulo));
    if (t.hora) {
      const [h, mi] = t.hora.split(':').map(Number), end = new Date(2000, 0, 1, h + 1, mi);
      L.push('DTSTART:' + compact(t.fecha) + 'T' + pad(h) + pad(mi) + '00', 'DTEND:' + compact(t.fecha) + 'T' + pad(end.getHours()) + pad(end.getMinutes()) + '00');
    } else L.push('DTSTART;VALUE=DATE:' + compact(t.fecha), 'DTEND;VALUE=DATE:' + compact(addDays(t.fecha, 1)));
    if (desc) L.push('DESCRIPTION:' + icsEsc(desc));
    if (b?.lugar) L.push('LOCATION:' + icsEsc(b.lugar));
    (t.hora ? ['-P1D', '-PT1H'] : ['-PT15H', 'PT9H']).forEach(tr => L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(t.titulo), 'TRIGGER:' + tr, 'END:VALARM'));
    L.push('END:VEVENT');
  });
  L.push('END:VCALENDAR');
  return L.map(icsFold).join('\r\n') + '\r\n';
}
const phoneMethod = () => localStorage.getItem('eas.phoneMethod') || 'calendar';
const b64url = str => { const bytes = new TextEncoder().encode(str); let bin = ''; bytes.forEach(b => bin += String.fromCharCode(b)); return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
async function addToPhone(items) {
  items = items.filter(t => t && t.fecha);
  if (!items.length) return toast('Pon primero una fecha');
  const ics = icsFor(items), name = 'ea-wedding.ics';
  const mark = () => { const u = currentUser(); items.forEach(t => { t.iphone = Object.assign({}, t.iphone, { [u]: true }); }); log('Añadió al iPhone: ' + (items.length === 1 ? '«' + items[0].titulo + '»' : items.length + ' citas')); save(); refresh(); };
  if (phoneMethod() === 'calendar' && navigator.serviceWorker?.controller) {
    const url = new URL('cal.ics', location.href); url.search = '?d=' + b64url(ics);
    mark();
    const a = document.createElement('a'); a.href = url.href; document.body.appendChild(a); a.click(); setTimeout(() => a.remove(), 1500);
    return;
  }
  try {
    const file = new File([ics], name, { type: 'text/calendar' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Ea’s Wedding' }); mark(); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  downloadBlob(new Blob([ics], { type: 'text/calendar' }), name); toast('Abre el archivo para añadirlo al Calendario'); mark();
}

/* ---------- PROVEEDORES ---------- */
const CAT_DEF = ['Espacios y fincas', 'Catering', 'Fotografía', 'Vídeo', 'Música en directo', 'DJ', 'Iluminación y sonido', 'Floristería', 'Decoración', 'Papelería e invitaciones', 'Tartas y dulces', 'Vestidos y trajes', 'Maquillaje y peluquería', 'Transporte', 'Otros'];
const cats = () => (db.profile.catProv && db.profile.catProv.length ? db.profile.catProv : CAT_DEF);
const provById = id => db.proveedores.find(p => p.id === id);
const origen = p => [p.ciudad, p.provincia].filter(Boolean).join(', ');
const tarifasDe = id => db.tarifas.filter(t => t.provId === id).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || (b.creada || '').localeCompare(a.creada || ''));
const webUrl = u => /^https?:\/\//i.test(u) ? u : 'https://' + u;
const MAX_ARCH = 500 * 1024;
let provQ = '', provZona = '', provOpen = {};
function parseImporte(v) {
  v = String(v || '').trim().replace(/[€\s]/g, ''); if (!v) return null;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(v)) v = v.replace(/\./g, '').replace(',', '.'); else v = v.replace(',', '.');
  const n = parseFloat(v); return isNaN(n) ? null : n;
}
function provListHTML() {
  if (!db.proveedores.length) return `<div class="empty">Aún no hay proveedores.<br>Pulsa + para añadir el primero.</div>`;
  const q = fold(provQ).trim();
  const list = db.proveedores.filter(p => (!provZona || (p.provincia || '').trim() === provZona) && (!q || fold([p.nombre, p.categoria, p.ciudad, p.provincia, p.contacto, p.notas].join(' ')).includes(q)));
  if (!list.length) return `<div class="empty">Ningún proveedor coincide.</div>`;
  const key = p => p.categoria || 'Sin categoría';
  const names = [...cats(), ...new Set(list.map(key).filter(c => !cats().includes(c)))], filtering = !!(q || provZona);
  return names.map(c => {
    const ps = list.filter(p => key(p) === c).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')); if (!ps.length) return '';
    return `<details class="card" data-cat="${esc(c)}" ${filtering || provOpen[c] ? 'open' : ''} ontoggle="provOpen[this.dataset.cat]=this.open">
      <summary style="cursor:pointer;text-align:center;font-family:var(--serif);font-size:17px;list-style:none">${esc(c)} · ${ps.length}</summary>
      <div style="margin-top:10px">${ps.map(p => { const lt = tarifasDe(p.id)[0]; return `<div class="row" data-act="openProv" data-id="${p.id}"><div class="main"><div class="t">${esc(p.nombre)}</div><div class="s">${esc([origen(p), lt && lt.importe != null && lt.importe !== '' ? 'Última tarifa ' + fmtMoney(+lt.importe) : ''].filter(Boolean).join(' · '))}</div></div></div>`; }).join('')}</div></details>`;
  }).join('');
}
function viewProveedores(v) {
  const zonas = [...new Set(db.proveedores.map(p => (p.provincia || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  if (provZona && !zonas.includes(provZona)) provZona = '';
  v.innerHTML = `<h1>Proveedores</h1><p class="sub">Por categoría, con su procedencia y su historial de tarifas</p>
    <div class="quick"><input id="pq" type="search" placeholder="Buscar proveedor, ciudad…" value="${esc(provQ)}"></div>
    ${zonas.length ? `<label class="f"><span>Zona</span><select id="pz"><option value="">Todas las zonas</option>${zonas.map(z => `<option ${z === provZona ? 'selected' : ''}>${esc(z)}</option>`).join('')}</select></label>` : ''}
    <div id="plist">${provListHTML()}</div>
    <div class="btns"><button class="btn ghost sm" data-act="catManage">Gestionar categorías</button></div>
    <button class="fab" data-act="newProv" aria-label="Nuevo proveedor">+</button>`;
  $('#pq', v).addEventListener('input', e => { provQ = e.target.value; $('#plist').innerHTML = provListHTML(); });
  $('#pz', v)?.addEventListener('change', e => { provZona = e.target.value; $('#plist').innerHTML = provListHTML(); });
}
function provForm(p = {}) {
  const f = (n, l, ex = '') => `<label class="f"><span>${l}</span><input name="${n}" value="${esc(p[n] || '')}" ${ex}></label>`;
  const provs = [...new Set(db.proveedores.map(x => (x.provincia || '').trim()).filter(Boolean))];
  const cur = p.categoria || '', opts = [...cats()]; if (cur && !opts.includes(cur)) opts.push(cur);
  const s = openSheet(`<h3>${p.id ? 'Editar' : 'Nuevo'} proveedor</h3><form id="pf">
    ${f('nombre', 'Nombre', 'required')}
    <label class="f"><span>Categoría</span><select name="categoria">${opts.map(c => `<option ${c === cur ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
    <div class="two">${f('ciudad', 'Ciudad o localidad')}<label class="f"><span>Provincia / zona</span><input name="provincia" list="provl" value="${esc(p.provincia || '')}"><datalist id="provl">${provs.map(x => `<option value="${esc(x)}">`).join('')}</datalist></label></div>
    ${f('contacto', 'Persona de contacto')}<div class="two">${f('tel', 'Teléfono', 'type="tel"')}${f('email', 'Email', 'type="email"')}</div>
    ${f('web', 'Web o Instagram')}
    <label class="f"><span>Notas</span><textarea name="notas">${esc(p.notas || '')}</textarea></label>
    <div class="btns"><button class="btn" type="submit">Guardar</button><button class="btn ghost" type="button" data-act="closeSheet">Cancelar</button></div></form>`);
  $('#pf', s).addEventListener('submit', e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)); Object.keys(f).forEach(k => f[k] = f[k].trim());
    let rec; if (p.id) { rec = provById(p.id); Object.assign(rec, f); } else { rec = { id: uid(), ...f, creada: new Date().toISOString() }; db.proveedores.push(rec); }
    log((p.id ? 'Editó' : 'Añadió') + ' el proveedor «' + rec.nombre + '»'); save(); closeSheet(); location.hash = '#proveedor/' + rec.id; refresh();
  });
}
function tarifaHTML(t) {
  const arch = t.archivo ? `<button class="btn ghost sm" data-act="openArch" data-id="${t.id}">Abrir ${esc(t.archivo.nombre)}</button>` : '';
  const enl = t.enlace ? `<a class="btn ghost sm" href="${esc(webUrl(t.enlace))}" target="_blank" rel="noopener">Abrir enlace</a>` : '';
  return `<div class="card"><div class="kv"><span>${esc(fmtDate(t.fecha))}</span><span><b>${t.importe != null && t.importe !== '' ? esc(fmtMoney(+t.importe)) : '—'}</b></span></div>
    <div style="margin:4px 0">${esc(t.concepto || '')}</div>${t.nota ? `<div class="hint" style="text-align:left;white-space:pre-wrap">${esc(t.nota)}</div>` : ''}
    <div class="btns" style="margin:8px 0 0;justify-content:flex-start">${arch}${enl}<button class="btn ghost sm" data-act="editTarifa" data-id="${t.id}">Editar</button><button class="btn danger sm" data-act="delTarifa" data-id="${t.id}">Borrar</button></div></div>`;
}
function viewProveedor(v, id) {
  const p = provById(id); if (!p) { location.hash = '#proveedores'; return; }
  const tf = tarifasDe(id), kv = (k, val) => val ? `<div class="kv"><span>${k}</span><span>${val}</span></div>` : '';
  v.innerHTML = `<a class="back" href="#proveedores">‹ Proveedores</a><div class="name" style="font-size:24px">${esc(p.nombre)}</div>
    <div class="countdown">${esc(origen(p) || 'Procedencia sin indicar')}</div>
    <div class="center" style="margin:10px 0"><span class="tag dark">${esc(p.categoria || 'Sin categoría')}</span></div>
    <div class="card">${kv('Contacto', esc(p.contacto))}${kv('Teléfono', p.tel ? `<a href="tel:${esc(p.tel.replace(/\s/g, ''))}">${esc(p.tel)}</a>` : '')}${kv('Email', p.email ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : '')}${kv('Web', p.web ? `<a href="${esc(webUrl(p.web))}" target="_blank" rel="noopener">${esc(p.web)}</a>` : '')}${kv('Notas', esc(p.notas))}</div>
    <div class="btns"><button class="btn ghost sm" data-act="editProv" data-id="${id}">Editar</button><button class="btn danger sm" data-act="delProv" data-id="${id}">Eliminar</button></div>
    <h2>Historial de tarifas</h2><p class="hint" style="margin-top:-6px">De la más reciente a la más antigua</p>
    ${tf.length ? tf.map(tarifaHTML).join('') : '<div class="empty" style="padding:10px">Aún no hay tarifas</div>'}
    <div class="btns"><button class="btn sm" data-act="newTarifa" data-id="${id}">+ Añadir tarifa</button></div>`;
}
function tarifaForm(provId, t = {}) {
  let archivo = t.archivo || null;
  const s = openSheet(`<h3>${t.id ? 'Editar' : 'Nueva'} tarifa</h3><form id="tff">
    <div class="two"><label class="f"><span>Fecha</span><input type="date" name="fecha" value="${esc(t.fecha || todayISO())}" required></label>
    <label class="f"><span>Importe (€)</span><input name="importe" inputmode="decimal" value="${t.importe != null && t.importe !== '' ? esc(String(t.importe).replace('.', ',')) : ''}" placeholder="1.500"></label></div>
    <label class="f"><span>Concepto</span><input name="concepto" required value="${esc(t.concepto || '')}" placeholder="Ej.: Pack boda completo 2027"></label>
    <label class="f"><span>Notas</span><textarea name="nota">${esc(t.nota || '')}</textarea></label>
    <label class="f"><span>Enlace (Drive u otro)</span><input name="enlace" value="${esc(t.enlace || '')}" placeholder="https://drive.google.com/…"></label>
    <div class="center"><div id="afile" class="hint">${archivo ? 'Archivo: ' + esc(archivo.nombre) : 'Sin archivo'}</div>
    <div class="btns" style="margin-top:0"><label class="btn ghost sm" style="cursor:pointer">Adjuntar dossier o tarifa (máx. 500 KB)<input type="file" id="afi" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" hidden></label><button class="btn danger sm" type="button" id="arm" style="display:${archivo ? 'inline-flex' : 'none'}">Quitar archivo</button></div></div>
    <div class="btns"><button class="btn" type="submit">Guardar</button><button class="btn ghost" type="button" data-act="closeSheet">Cancelar</button></div></form>`);
  $('#afi', s).onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > MAX_ARCH) { e.target.value = ''; return toast('Pesa más de 500 KB: súbelo a Drive y pega el enlace'); }
    const r = new FileReader(); r.onload = () => { archivo = { nombre: f.name, tipo: f.type || 'application/octet-stream', size: f.size, data: r.result }; $('#afile', s).textContent = 'Archivo: ' + f.name; $('#arm', s).style.display = 'inline-flex'; }; r.readAsDataURL(f);
  };
  $('#arm', s).onclick = () => { archivo = null; $('#afile', s).textContent = 'Sin archivo'; $('#arm', s).style.display = 'none'; $('#afi', s).value = ''; };
  $('#tff', s).addEventListener('submit', e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    const rec = { fecha: f.fecha, concepto: f.concepto.trim(), importe: parseImporte(f.importe), nota: f.nota.trim(), enlace: f.enlace.trim(), archivo };
    if (t.id) Object.assign(db.tarifas.find(x => x.id === t.id), rec); else db.tarifas.push({ id: uid(), provId, creada: new Date().toISOString(), ...rec });
    log((t.id ? 'Editó' : 'Añadió') + ' una tarifa de «' + (provById(provId)?.nombre || '') + '»'); save(); closeSheet(); refresh();
  });
}
function catSheet() {
  const c = cats();
  openSheet(`<h3>Categorías</h3><p class="hint">Se comparten entre Andrea y Martin.</p>
    ${c.map((n, i) => { const k = db.proveedores.filter(p => p.categoria === n).length; return `<div class="row" style="cursor:default"><div class="main"><div class="t">${esc(n)}</div><div class="s">${k} proveedor${k === 1 ? '' : 'es'}</div></div><button class="btn ghost sm" data-act="catRename" data-id="${i}">Renombrar</button>${k ? '' : `<button class="btn danger sm" data-act="catDel" data-id="${i}">Borrar</button>`}</div>`; }).join('')}
    <div class="btns"><button class="btn sm" data-act="catAdd">+ Nueva categoría</button><button class="btn ghost sm" data-act="closeSheet">Cerrar</button></div>`);
}
Object.assign(actions, {
  phoneTask: () => { phoneAfter = true; $('#tf').requestSubmit(); },
  phoneAllPending: () => addToPhone(pendingPhone()),
  qaSavePhone: () => { qPhone = true; $('#qf').requestSubmit(); },
  openProv: id => { location.hash = '#proveedor/' + id; }, newProv: () => provForm(), editProv: id => provForm(provById(id)),
  delProv: id => { const p = provById(id); if (!confirm('¿Eliminar este proveedor con todas sus tarifas?')) return; log('Eliminó el proveedor «' + p.nombre + '»'); db.proveedores = db.proveedores.filter(x => x.id !== id); db.tarifas = db.tarifas.filter(t => t.provId !== id); save(); location.hash = '#proveedores'; },
  newTarifa: id => tarifaForm(id), editTarifa: id => { const t = db.tarifas.find(x => x.id === id); tarifaForm(t.provId, t); },
  delTarifa: id => { if (!confirm('¿Borrar esta tarifa?')) return; log('Borró una tarifa'); db.tarifas = db.tarifas.filter(t => t.id !== id); save(); refresh(); },
  openArch: id => {
    const t = db.tarifas.find(x => x.id === id); if (!t?.archivo) return;
    const bin = atob(t.archivo.data.split(',')[1]), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const blob = new Blob([u8], { type: t.archivo.tipo }); const w = window.open(URL.createObjectURL(blob), '_blank'); if (!w) downloadBlob(blob, t.archivo.nombre);
  },
  catManage: () => catSheet(),
  catAdd: () => { const n = (prompt('Nombre de la nueva categoría') || '').trim(); if (!n) return; const c = [...cats()]; if (c.some(x => fold(x) === fold(n))) return toast('Esa categoría ya existe'); c.push(n); db.profile.catProv = c; log('Añadió la categoría «' + n + '»'); save(); catSheet(); refresh(); },
  catRename: i => { const c = [...cats()], old = c[i], n = (prompt('Nuevo nombre', old) || '').trim(); if (!n || n === old) return; if (c.some((x, k) => k !== +i && fold(x) === fold(n))) return toast('Esa categoría ya existe'); c[i] = n; db.profile.catProv = c; db.proveedores.forEach(p => { if (p.categoria === old) p.categoria = n; }); log('Renombró la categoría «' + old + '» a «' + n + '»'); save(); catSheet(); refresh(); },
  catDel: i => { const c = [...cats()], n = c[i]; if (!confirm('¿Borrar la categoría «' + n + '»?')) return; c.splice(i, 1); db.profile.catProv = c; log('Borró la categoría «' + n + '»'); save(); catSheet(); refresh(); }
});

/* ---------- Arranque ---------- */
route();
Sync.init();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });

// Al volver a la app desde otra (p. ej. Calendario) iOS puede soltar la imagen del logo: se vuelve a cargar.
function refreshLogo(){ document.querySelectorAll('img.logo').forEach(i => { i.src = LOGO + '?r=' + Date.now(); }); }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshLogo(); });
window.addEventListener('pageshow', refreshLogo);
