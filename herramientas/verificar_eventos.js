const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
let clock = Date.UTC(2099, 4, 10, 12), user = { email:'creador@example.test', promo_token:'token-de-prueba' };
class Reloj extends Date { constructor(...args) { super(...(args.length ? args : [clock])); } static now() { return clock; } }
const elements = {}, overlays = [], requests = [], opened = [];
function node() { return { innerHTML:'',value:'',hidden:false,isConnected:true,style:{},children:{},setAttribute(){},getClientRects(){return [{}];},focus(){},addEventListener(){},querySelector(selector) {
 if (selector.startsWith('#') && !this.innerHTML.includes('id="'+selector.slice(1)+'"')) {
  const hijo=Object.values(this.children).find(x=>typeof x.innerHTML==='string'&&x.innerHTML.includes('id="'+selector.slice(1)+'"'));
  return hijo||null;
 }
 return this.children[selector] || (this.children[selector]=node());
},querySelectorAll(){return [];},remove(){this.isConnected=false;const i=overlays.indexOf(this);if(i>=0)overlays.splice(i,1);} }; }
for (const id of ['form-feria','fer-etiqueta','fer-titulo-form','fer-guardar','fer-info','lista-notas','resultados-global','buscar-global','fer-nombre','fer-fecha','fer-hora-inicio','fer-hora-fin','fer-lugar','fer-contacto','fer-telefono','fer-desc']) elements[id]=node();
elements['form-feria'].reset=()=>{for(const id of ['fer-etiqueta','fer-nombre','fer-fecha','fer-hora-inicio','fer-hora-fin','fer-lugar','fer-contacto','fer-telefono','fer-desc'])elements[id].value='';};
const esc = v => String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const c = { Date:Reloj,Intl,AbortController,crypto:require('crypto').webcrypto,Uint8Array,escapeHtml:esc,usuarioActual:()=>user,requiereLogin:()=>!!user,document:{ activeElement:node(),body:{appendChild:n=>overlays.push(n)},createElement:node,getElementById:id=>elements[id]||null,addEventListener(){},querySelector(){return null;},querySelectorAll(){return[];} },window:{scrollTo(){}},App:{vistaActual:'view-notas',data:{emprendimientos:[{id:'biz',nombre:'Curso comercial',categoria:'Otro'}],emprendedores:[{nombre:'Curso contacto',emprendimiento:'Contacto'}]}},CATEGORIAS:[],ALIAS_TABLA:[],esCalibreAceite:()=>false,iconoDeCategoria:()=> 'fa-store',inicial:n=>n[0],showToast:m=>{c.toast=m;},irAVista:v=>{c.App.vistaActual=v;},setTimeout:()=>1,clearTimeout(){},setInterval(){},localforage:{getItem:async()=>null,setItem:async()=>{}},apiUrl:p=>p };
vm.createContext(c);
function cargar(nombre){vm.runInContext(fs.readFileSync(path.join(root,'www/js',nombre),'utf8'),c);}
for(const f of ['42-eventos-api.js','43-eventos-formulario.js','44-eventos-vistas.js','45-eventos-administracion.js','10-buscador.js','11-buscador-ui.js'])cargar(f);
const evento = {id:'e1',titulo:'Curso público',etiqueta:'tag1',etiquetaNombre:'Curso',fecha:'2099-05-10',horaInicio:'09:00',horaFin:'18:00',lugar:'Lugar',contacto:'Organizador',telefono:'88881234',texto:'Toda la información',inicio:clock/1000,fin:clock/1000+3600,expires:clock/1000+90000};
const cfg = {revision:1,mensaje:'Instrucciones',etiquetas:[{id:'tag1',nombre:'Curso',precio:1500,activo:true}],sinpes:[{id:'s1',nombre:'Cuenta de pruebas',telefono:'88881234'}],seleccion_sinpe:'s1',cuentas:[{id:'c1',nombre:'Prueba',banco:'BCR',moneda:'colones',cuenta:'CUENTA-DE-PRUEBA'}],seleccion_cuentas:['c1']};
const realAbrir = c.abrirEvento;
let actual = {...evento,editable:true,superusuario:false,owner:user.email,estado:'aprobado',precio:1500,paid_at:10,revision:5,pago:{sinpe:{telefono:'88881234',nombre:'Cuenta de pruebas'},cuentas:cfg.cuentas,mensaje:cfg.mensaje},historial:[]};
c.eventoApi=async(ruta,datos,metodo)=>{requests.push({ruta,datos,metodo});if(ruta==='/opciones')return cfg;if(ruta==='/cotizar')return{precio:1500,pago:{sinpe:{telefono:'88881234',nombre:'Cuenta de pruebas'},cuentas:cfg.cuentas,mensaje:cfg.mensaje},config_revision:1,expires:evento.expires};if(metodo==='PUT'||metodo==='POST')return{...actual,...datos,id:'e1'};return actual;};
c.sincronizarEventos=async()=>{};
(async function(){
 c.Eventos.items=[evento,{...evento,id:'vencido',expires:clock/1000}];c.renderEventos();assert.ok(elements['lista-notas'].innerHTML.includes('data-evento="e1"'));assert.ok(!elements['lista-notas'].innerHTML.includes('data-evento="vencido"'));
 let box=elements['resultados-global'];c.renderResultados('curso',box);assert.ok(box.innerHTML.includes('data-tipo="evento"'));assert.ok(!box.innerHTML.includes('data-tipo="emprend"'));assert.ok(!box.innerHTML.includes('data-tipo="contacto"'));
 c.App.vistaActual='view-emprendimientos';c.renderResultados('curso',box);assert.ok(box.innerHTML.includes('data-tipo="emprend"'));assert.ok(!box.innerHTML.includes('data-tipo="evento"'));
 c.App.vistaActual='view-directorio';c.renderResultados('curso',box);assert.ok(box.innerHTML.includes('data-tipo="contacto"'));assert.ok(!box.innerHTML.includes('data-tipo="evento"'));
 actual={...evento};await assert.rejects(c.abrirEdicionEvento('e1'),/Solo el creador/);
 actual={...evento,editable:true,superusuario:false,owner:user.email,estado:'aprobado',precio:1500,paid_at:10,revision:5,pago:cfg,historial:[]};
 await c.abrirEdicionEvento('e1');for(const [k,id] of Object.entries(c.EVENTO_CAMPOS))assert.equal(elements[id].value,evento[k]);assert.equal(elements['fer-etiqueta'].value,'tag1');assert.equal(elements['fer-titulo-form'].textContent,'Editar evento');
 c.abrirEvento=async id=>opened.push(id);requests.length=0;await c.guardarEvento({preventDefault(){}});assert.equal(requests.filter(r=>r.ruta==='/cotizar').length,0);let ov=overlays.at(-1);assert.ok(ov.innerHTML.includes('No se genera un nuevo cobro automático'));await ov.querySelector('#evt-enviar').onclick();let envio=requests.find(r=>r.metodo==='PUT');assert.equal(envio.datos.revision,5);assert.equal(envio.datos.titulo,evento.titulo);assert.equal(opened.at(-1),'e1');
 await c.prepararNuevoEvento();assert.equal(elements['fer-titulo-form'].textContent,'Nuevo evento');assert.equal(elements['fer-nombre'].value,'');const nonce=c.Eventos.solicitud;assert.ok(nonce);
 for(const [k,id]of Object.entries(c.EVENTO_CAMPOS))elements[id].value=evento[k];elements['fer-etiqueta'].value='tag1';actual={...actual,estado:'pendiente',paid_at:null};requests.length=0;await c.guardarEvento({preventDefault(){}});ov=overlays.at(-1);assert.ok(ov.innerHTML.includes('SINPE Móvil'));assert.ok(ov.innerHTML.includes('CUENTA-DE-PRUEBA'));assert.ok(ov.innerHTML.includes(c.eventoMoneda(1500)));await ov.querySelector('#evt-enviar').onclick();envio=requests.find(r=>r.metodo==='POST');assert.equal(envio.datos.solicitud,nonce);assert.equal(envio.datos.precio,1500);assert.equal(envio.datos.config_revision,1);
 c.abrirEvento=realAbrir;actual={...evento};await c.abrirEvento('e1');ov=overlays.at(-1);assert.ok(!ov.innerHTML.includes('Editar evento'));assert.ok(ov.innerHTML.includes('Toda la información'));
 actual={...evento,editable:true,superusuario:false,owner:user.email,estado:'pendiente',precio:1500,paid_at:10,revision:7,historial:[]};await c.abrirEvento('e1');ov=overlays.at(-1);assert.ok(ov.innerHTML.includes('Editar evento'));assert.ok(!ov.innerHTML.includes('Volver a aprobar evento'));
 actual={...actual,superusuario:true};await c.abrirEvento('e1');assert.ok(overlays.at(-1).innerHTML.includes('Volver a aprobar evento'));
 c.eventoApi=async()=>{throw Object.assign(new Error('No publicado'),{status:403});};await assert.rejects(c.abrirEvento('e1'),/No publicado/);
 c.eventoApi=async()=>{throw new Error('Sin conexión');};await c.abrirEvento('e1');assert.ok(overlays.at(-1).innerHTML.includes('Sin conexión'));assert.ok(!overlays.at(-1).innerHTML.includes('Editar evento'));
 c.eventoApi=async()=>({superusuario:false,eventos:[actual],total:1,pagina:0,paginas:1,q:''});await c.abrirAdministracionEventos();assert.ok(!overlays.at(-1).innerHTML.includes('id="evt-tarifas"'));
 c.eventoApi=async()=>({superusuario:true,eventos:[actual],total:1,pagina:0,paginas:1,q:'',config:cfg});await c.abrirAdministracionEventos();assert.ok(overlays.at(-1).innerHTML.includes('id="evt-tarifas"'));
 c.abrirConfiguracionEventos({...cfg,sinpes:[{id:'s1',nombre:'Jenny Ceciliano Córdoba',telefono:'86529837'}],cuentas:[{id:'c1',nombre:'Jenny Ceciliano Córdoba',banco:'MUCAP',moneda:'colones',cuenta:'CR66080402010100715103'}]});
 ov=overlays.at(-1);assert.ok(ov.querySelector('#evt-sinpe').innerHTML.includes('86529837 — Jenny Ceciliano Córdoba'));assert.ok(ov.querySelector('#evt-sinpe').innerHTML.includes('Agregar otro número SINPE'));assert.ok(ov.querySelector('#evt-cuentas').innerHTML.includes('CR66080402010100715103'));assert.ok(ov.querySelector('#evt-cuentas').innerHTML.includes('Ninguna / Solo usar SINPE'));assert.ok(ov.innerHTML.includes('Agregar otro número de cuenta'));assert.ok(ov.innerHTML.includes('dólares'));assert.ok(ov.innerHTML.includes('Formas de pago'));assert.ok(ov.innerHTML.includes('evt-acordeon'));assert.ok(ov.innerHTML.includes('No se requiere precio'));ov.remove();
 clock=evento.expires*1000;c.renderEventos();assert.ok(!elements['lista-notas'].innerHTML.includes('data-evento="e1"'));
 const html=fs.readFileSync(path.join(root,'www/parciales/ferias.html'),'utf8');for(const id of Object.values(c.EVENTO_CAMPOS))assert.ok(html.includes('id="'+id+'"'));assert.ok(html.includes('id="fer-etiqueta"'));
 console.log('OK: formulario único precargado, solicitud y modal de pago, edición sin recobro, controles por permiso, recuperación de pendientes, búsqueda aislada, caché pública y vencimiento');
})().catch(error=>{console.error(error);process.exitCode=1;});
