const fs = require('fs'), vm = require('vm'), assert = require('assert/strict'), path = require('path');
const root = path.resolve(__dirname, '..');
let clock = Date.UTC(2026, 0, 31, 12), u = { id: 1, email: 'visitante@example.test' };
class Reloj extends Date { constructor(...args) { super(...(args.length ? args : [clock])); } static now() { return clock; } }
const nodes = {}, listeners = [], memoria = new Map();
function nodo() { return { hidden: false, innerHTML: '', style: {}, children: [], attrs: {}, isConnected: true, classList: { toggle() {}, add() {}, remove() {} }, setAttribute(k,v) { this.attrs[k] = v; }, append(...v) { this.children.push(...v); }, focus() { this.enfocado = true; }, remove() { delete nodes[this.id]; }, querySelector() { return nodo(); } }; }
const previo = nodo();
const document = { activeElement: previo, body: { style: { overflow: '' }, appendChild(el) { nodes[el.id] = el; } }, addEventListener(...args) { listeners.push(args); }, getElementById(id) { return nodes[id] || null; }, createElement: nodo, querySelector() { return null; } };
const c = { Date: Reloj, URL, Headers, Math, document, App: { data: { emprendimientos: [] } }, usuarioActual: () => u, escapeHtml: v => String(v || ''), apiUrl: p => 'https://kenth1977.pythonanywhere.com' + p, iconoDeCategoria: () => 'fa-store', showToast() {}, mostrarLogin() {}, saveData: () => Promise.resolve(), requestAnimationFrame: () => 1, setTimeout: () => 1, clearTimeout() {}, matchMedia: () => ({ matches: true }), location: { href: 'https://kenth1977.pythonanywhere.com/app/', reload() { c.recargas++; } }, recargas: 0, irAVista(v) { c.vista = v; }, localforage: { getItem: async k => memoria.get(k), setItem: async (k,v) => memoria.set(k,v) } };
vm.createContext(c);
function cargar(file) { vm.runInContext(fs.readFileSync(path.join(root, 'www/js', file), 'utf8'), c); }
cargar('05-render.js'); cargar('28-reportes.js'); c.renderTodo = () => {};
const e = { id: 1, owner: 'creador@example.test', nombre: 'Negocio', categoria: 'Cat1', provincia: 'P', distrito: 'D' }; c.App.data.emprendimientos = [e];
c.toggleLike(1); assert.equal(c.totalLikes(e), 1);
for (let i=0;i<20;i++) { c.toggleLike(1); assert.equal(c.totalLikes(e), 0); clock += 60000; c.toggleLike(1); assert.equal(c.totalLikes(e), 1); assert.equal(e.likes.length, 1); assert.equal(e.likes[0].ts, clock); }
clock = c.finPlazoLike(e.likes[0]); assert.equal(c.tieneLike(e), false); assert.equal(c.totalLikes(e), 1); c.toggleLike(1); assert.equal(c.totalLikes(e), 2); u = { id: 1, email: 'creador@example.test' }; c.toggleLike(1); assert.equal(c.totalLikes(e), 2); u = { id: 1, email: 'visitante@example.test' };
cargar('35-interacciones.js'); c.ampliarImagenPerfil({ src: 'data:image/jpeg;base64,AAAA', alt: 'Logo' }); assert.equal(document.body.style.overflow, 'hidden'); const modal = nodes['imagen-ampliada']; assert.ok(modal.children[0].src); modal.children[1].onclick(); assert.equal(document.body.style.overflow, ''); assert.equal(previo.enfocado, true);
const clickLogo = listeners.find(x => x[0] === 'click' && x[1].toString().includes('.topbar-logo'))[1]; clickLogo({ target: { closest: () => ({}) }, preventDefault() {} }); assert.equal(c.vista, 'view-inicio'); assert.equal(c.recargas, 1);
const enviadas = []; c.sesion = { user: { promo_token: 'token-fixture' } }; c.window = { fetch: async (url, opciones) => { enviadas.push([url, opciones]); return {}; } }; cargar('07c-sesion-servidor.js');
(async function () {
 await c.window.fetch(c.apiUrl('/api/promociones/panel')); assert.equal(enviadas[0][1].headers.get('Authorization'), 'Bearer token-fixture');
 await c.window.fetch('https://example.invalid/fuera'); assert.equal(enviadas[1][1], undefined);
 await c.window.fetch(c.apiUrl('/api/usuarios/1'), { headers: { Authorization: 'Bearer registro-fixture' } }); assert.equal(enviadas[2][1].headers.get('Authorization'), 'Bearer registro-fixture');
 for (const id of ['lista-emprendimientos','filtro-activo','filtro-nombre','emprendimientos-count','emp-pag','promo-gratuitos','promo-carrusel']) nodes[id] = nodo();
 c.Promociones = { publico: { activos: [{ emp: '1', starts: clock/1000-10, ends: clock/1000+100 }], capacidad: 10 }, desfase: 0 };
 c.promoAhora = () => clock/1000; c.App.ordenNegocios = ['1','2','3']; c.App.data.emprendimientos = [e, {...e,id:2}, {...e,id:3,categoria:'Cat2'}]; cargar('39-carrusel-gratuitos.js'); c.renderEspaciosPromocionados();
 assert.ok(nodes['lista-emprendimientos'].innerHTML.includes('data-id="1"')); assert.ok(!nodes['lista-emprendimientos'].innerHTML.includes('data-id="2"')); assert.ok(nodes['promo-carrusel'].innerHTML.includes('data-id="2"')); assert.ok(nodes['promo-carrusel'].innerHTML.includes('data-id="3"'));
 const orden = nodes['promo-carrusel'].innerHTML; c.renderEspaciosPromocionados(); assert.equal(nodes['promo-carrusel'].innerHTML, orden);
 c.App.filtroCategoria = 'Cat1'; c.renderEspaciosPromocionados(); assert.ok(!nodes['promo-carrusel'].innerHTML.includes('data-id="3"'));
 const alarmas = [], canceladas = []; c.Capacitor = { Plugins: { LocalNotifications: { checkPermissions: async () => ({display:'granted'}), createChannel: async () => {}, cancel: async v => canceladas.push(v), schedule: async v => alarmas.push(v) } } }; c.window.Capacitor = c.Capacitor;
 c.Promociones.panel = { activos: [{ emp:'1',uid:1,ends:clock/1000+7*86400 }], solicitudes: [], superusuario:false }; c.promoFecha = n => String(n); c.promoModal = () => { c.avisos=(c.avisos||0)+1; return nodo(); }; cargar('40-promociones-avisos.js'); await c.actualizarAvisosPromocion();
 assert.equal(alarmas[0].notifications.length, 2); assert.equal(alarmas[0].notifications[0].schedule.at.getTime(), clock + 5*86400000); await c.actualizarAvisosPromocion(); assert.equal(alarmas.length,1);
 c.Promociones.panel.activos[0].ends = clock/1000+23*3600; await c.actualizarAvisosPromocion(); assert.equal(c.avisos,1); await c.actualizarAvisosPromocion(); assert.equal(c.avisos,1);
 u = null; c.Promociones.panel = null; await c.actualizarAvisosPromocion(); assert.ok(canceladas.length >= 1);
 cargar('41-promociones-cobro.js'); assert.equal(c.CobroPromociones.habilitado,false); await assert.rejects(c.CobroPromociones.iniciar());
 console.log('OK: like libre sin inflación, reinicio y vencimiento, modal, logo a Inicio, token solo al API, espacios pagados, carrusel, notificaciones programadas/deduplicadas y cobro deshabilitado');
})().catch(error => { console.error(error); process.exitCode=1; });
