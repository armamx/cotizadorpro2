(function(){
'use strict';
const db=window.supabaseClient;
const $=id=>document.getElementById(id);
let DATA={equipos:[],planes:[],plazos:[],vigencias:[],precios:[],servicios:[]};
const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const val=id=>($(id)?.value??'').trim();
const num=id=>val(id)===''?null:Number(val(id));
const lines=id=>val(id).split('\n').map(x=>x.trim()).filter(Boolean);
const jsonParse=(s,fallback={})=>{try{return s.trim()?JSON.parse(s):fallback}catch(e){throw new Error('JSON inválido: '+e.message)}};
function msg(text,type='success'){const e=$('estado');e.className='status '+type;e.textContent=text}
async function all(table){let out=[],from=0;while(true){const {data,error}=await db.from(table).select('*').range(from,from+999);if(error)throw error;if(!data?.length)break;out.push(...data);if(data.length<1000)break;from+=1000}return out}
async function reload(){msg('Actualizando catálogo…','');const [equipos,planes,plazos,vigencias,precios,servicios]=await Promise.all(['equipos','planes','plan_plazos','vigencias','precios','servicios'].map(all));DATA={equipos,planes,plazos,vigencias,precios,servicios};renderAll();msg(`✓ ${equipos.length} equipos · ${planes.length} planes · ${precios.length} precios`,'success')}
function renderAll(){renderEquipos();renderPlanes();renderServicios();renderVigencias()}
function badge(on){return `<span class="badge ${on?'on':'off'}">${on?'Disponible':'No disponible'}</span>`}
function renderEquipos(){const q=val('buscarEquipo').toLowerCase();const arr=DATA.equipos.filter(e=>!q||[e.codigo,e.nombre,e.marca,e.capacidad].some(x=>String(x||'').toLowerCase().includes(q))).sort((a,b)=>String(a.nombre).localeCompare(String(b.nombre)));$('listaEquipos').innerHTML=arr.map(e=>`<div class="item">${e.imagen_url?`<img class="thumb" src="${esc(e.imagen_url)}" alt="">`:`<div class="thumb"></div>`}<div class="grow"><strong>${esc(e.nombre||e.codigo)}</strong><div class="meta">${esc(e.marca||'')} · ${esc(e.capacidad||'')} · ${esc(e.codigo||'')}</div><div style="margin-top:7px">${badge(e.activo!==false)}</div></div><div class="row"><button class="primary" onclick="editarEquipo('${esc(e.id)}')">Editar</button><button class="${e.activo!==false?'danger':'ok'}" onclick="toggleEquipo('${esc(e.id)}',${e.activo===false})">${e.activo!==false?'Desactivar':'Activar'}</button></div></div>`).join('')||'<div class="card">No se encontraron equipos.</div>'}
function renderPlanes(){$('listaPlanes').innerHTML=DATA.planes.sort((a,b)=>(a.orden??999)-(b.orden??999)).map(p=>`<div class="item"><div class="grow"><strong>${esc(p.nombre)}</strong><div class="meta">${esc(p.codigo)} · Renta: $${esc(p.renta_mensual??p.renta??p.datos_extra?.renta_mensual??0)}</div><div style="margin-top:7px">${badge(p.activo!==false)}</div></div><button class="primary" onclick="editarPlan('${esc(p.id)}')">Editar</button></div>`).join('')}
function renderServicios(){$('listaServicios').innerHTML=DATA.servicios.map(s=>`<div class="item"><div class="grow"><strong>${esc(s.nombre||s.codigo)}</strong><div class="meta">${esc(s.codigo)}${s.precio!=null?' · $'+esc(s.precio):''}</div><div style="margin-top:7px">${badge(s.activo!==false)}</div></div><button class="primary" onclick="editarServicio('${esc(s.id)}')">Editar</button></div>`).join('')}
function renderVigencias(){$('listaVigencias').innerHTML=DATA.vigencias.map(v=>`<div class="item"><div class="grow"><strong>${esc(v.nombre||'Vigencia')}</strong><div class="meta">${esc(v.fecha_inicio||'—')} → ${esc(v.fecha_fin||'indefinido')}</div><div style="margin-top:7px">${badge(v.activa!==false)}</div></div><button class="primary" onclick="editarVigencia('${esc(v.id)}')">Editar</button></div>`).join('')}
function open(title,html){$('modalTitle').textContent=title;$('modalBody').innerHTML=html;$('modal').classList.remove('hidden')}
window.cerrarModal=()=>{$('modal').classList.add('hidden');$('modalBody').innerHTML=''};
function field(label,id,value='',type='text',extra=''){return `<div><label>${label}</label><input id="${id}" type="${type}" value="${esc(value??'')}" ${extra}></div>`}
function textarea(label,id,value='',hint=''){return `<div><label>${label}</label><textarea id="${id}">${esc(value??'')}</textarea>${hint?`<div class="note">${hint}</div>`:''}</div>`}
function normalizarListaEditor(lista){
    if(!Array.isArray(lista)) return [];
    return lista.map(function(item){
        if(typeof item === 'string') return item;
        if(item == null) return '';
        try{return JSON.stringify(item)}catch(e){return String(item)}
    }).filter(Boolean);
}
function parseListaEditor(id){
    return lines(id).map(function(item){
        const t=item.trim();
        if((t.startsWith('{')&&t.endsWith('}'))||(t.startsWith('[')&&t.endsWith(']'))){
            try{return JSON.parse(t)}catch(e){}
        }
        return t;
    });
}
function objecionesToLines(lista){
    if(!Array.isArray(lista)) return '';
    return lista.map(function(item){
        if(typeof item === 'string') return item;
        if(item && typeof item === 'object'){
            if('a' in item || 'q' in item){
                const a = item.a ?? '';
                const q = item.q ?? '';
                if(a && q) return 'Respuesta: ' + a + ' | Pregunta: ' + q;
                if(a) return 'Respuesta: ' + a;
                if(q) return 'Pregunta: ' + q;
            }
            return Object.values(item).filter(v=>v!=null && v!=='').join(' | ');
        }
        return '';
    }).filter(Boolean).join('\n');
}
function parseObjecionesEditor(id){
    return lines(id).map(function(linea){
        const marca = ' | Pregunta: ';
        if(linea.startsWith('Respuesta: ')){
            const cuerpo = linea.slice('Respuesta: '.length);
            const pos = cuerpo.indexOf(marca);
            if(pos >= 0){
                return {
                    a: cuerpo.slice(0,pos).trim(),
                    q: cuerpo.slice(pos + marca.length).trim()
                };
            }
            return {a:cuerpo.trim(), q:''};
        }
        if(linea.startsWith('Pregunta: ')){
            return {a:'', q:linea.slice('Pregunta: '.length).trim()};
        }
        return linea;
    });
}
function specsToLines(specs){
    if(!specs || typeof specs !== 'object' || Array.isArray(specs)) return '';
    return Object.entries(specs).map(function([clave,valor]){
        if(valor == null || valor === '') return clave;
        if(typeof valor === 'object'){
            try{return clave + ': ' + JSON.stringify(valor)}catch(e){return clave + ': ' + String(valor)}
        }
        return clave + ': ' + valor;
    }).join('\n');
}
function parseSpecsLines(id){
    const resultado = {};
    lines(id).forEach(function(linea,indice){
        const pos = linea.indexOf(':');
        if(pos > 0){
            const clave = linea.slice(0,pos).trim();
            const valor = linea.slice(pos+1).trim();
            if(clave) resultado[clave] = valor;
        } else {
            resultado['Característica ' + (indice + 1)] = linea;
        }
    });
    return resultado;
}
function equipoForm(e,isNew){const specs=specsToLines(e?.especificaciones||{});const sell=normalizarListaEditor(e?.argumentos_venta).join('\n');const obj=objecionesToLines(e?.objeciones||[]);const statusComercial=e?.datos_extra?.status || (e?.activo!==false?'RESURTIBLE':'NO RESURTIBLE');let html=`<div class="grid">${field('Código','eq_codigo',e?.codigo||'', 'text',isNew?'':'readonly')}${field('Nombre','eq_nombre',e?.nombre||'')}${field('Marca','eq_marca',e?.marca||'')}${field('Capacidad','eq_capacidad',e?.capacidad||'')}<div><label>Estado en catálogo</label><select id="eq_activo"><option value="1" ${e?.activo!==false?'selected':''}>Disponible</option><option value="0" ${e?.activo===false?'selected':''}>No disponible</option></select></div><div><label>Status comercial en cotización</label><select id="eq_status"><option value="RESURTIBLE" ${statusComercial==='RESURTIBLE'?'selected':''}>RESURTIBLE</option><option value="NO RESURTIBLE" ${statusComercial==='NO RESURTIBLE'?'selected':''}>NO RESURTIBLE</option></select></div>${field('URL de imagen','eq_imagen',e?.imagen_url||'')}</div><div class="subcard"><h3>Imagen</h3><div class="row"><input id="eq_file" type="file" accept="image/*" style="max-width:430px"><button onclick="subirImagenEquipo('${esc(e?.id||'')}')">Subir imagen</button>${e?.imagen_url?`<img class="preview" src="${esc(e.imagen_url)}">`:''}</div><div class="note">Se sube al bucket <b>equipos</b> y se guarda la URL automáticamente.</div></div><div class="grid">${textarea('Características (una por línea)','eq_specs',specs,'Puedes escribir por ejemplo: Pantalla: AMOLED 6.9&quot; o simplemente una característica por línea.')}${textarea('Argumentos de venta (uno por línea)','eq_sell',sell)}${textarea('Objeciones (una por línea)','eq_obj',obj,'Puedes escribir texto normal. Si una objeción tiene respuesta y pregunta se mostrará como: Respuesta: ... | Pregunta: ...')}</div><div class="row" style="margin-top:18px"><button class="primary" onclick="guardarEquipo('${esc(e?.id||'')}')">💾 Guardar equipo</button>${!isNew?`<button class="danger" onclick="eliminarEquipo('${esc(e.id)}')">Eliminar definitivamente</button>`:''}</div>`;
if(!isNew)html+=preciosForm(e);return html}
function preciosForm(e){const ep=DATA.precios.filter(x=>x.equipo_id===e.id);const contado=ep.find(x=>x.precio_contado!=null)?.precio_contado??'';let h=`<div class="subcard"><h3>💰 Precios</h3>${field('Precio de contado','eq_contado',contado,'number','step="0.01"')}<div class="price-grid" style="margin-top:14px"><div class="price-head">Plan</div>${[24,30,36].map(m=>`<div class="price-head">${m} meses</div>`).join('')}`;for(const p of DATA.planes.filter(x=>x.activo!==false)){h+=`<div><strong>${esc(p.nombre)}</strong></div>`;for(const m of [24,30,36]){const plazo=DATA.plazos.find(x=>Number(x.meses)===m);const row=ep.find(x=>x.plan_id===p.id&&x.plazo_id===plazo?.id);h+=`<div><input class="price-input" data-plan="${esc(p.id)}" data-plazo="${esc(plazo?.id||'')}" data-row="${esc(row?.id||'')}" type="number" step="0.01" value="${esc(row?.precio??'')}" placeholder="—"></div>`}}h+=`</div><div class="row" style="margin-top:14px"><button class="primary" onclick="guardarPrecios('${esc(e.id)}')">Guardar precios</button></div></div>`;return h}
window.nuevoEquipo=()=>open('Agregar equipo',equipoForm(null,true));
window.editarEquipo=id=>{const e=DATA.equipos.find(x=>x.id===id);if(e)open('Editar equipo',equipoForm(e,false))};
window.guardarEquipo=async id=>{try{const codigo=val('eq_codigo'),nombre=val('eq_nombre');if(!codigo||!nombre)throw new Error('Código y nombre son obligatorios.');const actual=id?DATA.equipos.find(x=>x.id===id):null;const datosExtra={...(actual?.datos_extra||{}),status:val('eq_status')||'RESURTIBLE'};const payload={codigo,nombre,marca:val('eq_marca'),capacidad:val('eq_capacidad'),activo:val('eq_activo')==='1',imagen_url:val('eq_imagen')||null,especificaciones:parseSpecsLines('eq_specs'),argumentos_venta:parseListaEditor('eq_sell'),objeciones:parseObjecionesEditor('eq_obj'),datos_extra:datosExtra};let r=id?await db.from('equipos').update(payload).eq('id',id).select().single():await db.from('equipos').insert(payload).select().single();if(r.error)throw r.error;await reload();cerrarModal();msg('✓ Equipo guardado en Supabase','success')}catch(e){alert('No se pudo guardar: '+(e.message||e))}};
window.toggleEquipo=async(id,activar)=>{if(!confirm(activar?'¿Activar este equipo?':'¿Desactivar este equipo? No aparecerá en el cotizador.'))return;const {error}=await db.from('equipos').update({activo:activar}).eq('id',id);if(error)return alert(error.message);await reload()};
window.eliminarEquipo=async id=>{const e=DATA.equipos.find(x=>x.id===id);if(!confirm(`ELIMINAR definitivamente ${e?.nombre||''}?\n\nSe intentarán borrar también sus precios. Esta acción no se puede deshacer.`))return;try{let r=await db.from('precios').delete().eq('equipo_id',id);if(r.error)throw r.error;r=await db.from('equipos').delete().eq('id',id);if(r.error)throw r.error;await reload();cerrarModal()}catch(e){alert('No se pudo eliminar: '+e.message)}};
window.subirImagenEquipo=async id=>{try{const f=$('eq_file')?.files?.[0];if(!f)throw new Error('Selecciona una imagen.');const codigo=val('eq_codigo')||'equipo';const ext=(f.name.split('.').pop()||'jpg').toLowerCase();const path=`${codigo}/${Date.now()}.${ext}`;const up=await db.storage.from('equipos').upload(path,f,{upsert:true,contentType:f.type||undefined});if(up.error)throw up.error;const pub=db.storage.from('equipos').getPublicUrl(path);const url=pub.data.publicUrl;$('eq_imagen').value=url;if(id){const r=await db.from('equipos').update({imagen_url:url,imagen_path:path}).eq('id',id);if(r.error)throw r.error;await reload()}alert('Imagen subida correctamente. Guarda el equipo para confirmar los demás cambios.')}catch(e){alert('No se pudo subir la imagen: '+e.message)}};
window.guardarPrecios=async equipoId=>{try{const contado=num('eq_contado');const inputs=[...document.querySelectorAll('.price-input')];for(const i of inputs){if(!i.dataset.plazo)continue;const precio=i.value.trim()===''?null:Number(i.value);if(i.dataset.row){const r=await db.from('precios').update({precio,precio_contado:contado,activo:true}).eq('id',i.dataset.row);if(r.error)throw r.error}else if(precio!==null){const payload={equipo_id:equipoId,plan_id:i.dataset.plan,plazo_id:i.dataset.plazo,precio,precio_contado:contado,activo:true};const r=await db.from('precios').insert(payload);if(r.error)throw r.error}}if(contado!==null){const r=await db.from('precios').update({precio_contado:contado}).eq('equipo_id',equipoId);if(r.error)throw r.error}await reload();alert('Precios guardados en Supabase.')}catch(e){alert('No se pudieron guardar precios: '+e.message)}};
function planForm(p){const extra=JSON.stringify(p?.datos_extra||{},null,2);const renta=p?.renta_mensual??p?.renta??p?.datos_extra?.renta_mensual??'';return `<div class="grid">${field('Código','pl_codigo',p?.codigo||'', 'text',p?'readonly':'')}${field('Nombre','pl_nombre',p?.nombre||'')}${field('Renta mensual','pl_renta',renta,'number','step="0.01"')}${field('Orden','pl_orden',p?.orden??'','number')}<div><label>Estado</label><select id="pl_activo"><option value="1" ${p?.activo!==false?'selected':''}>Activo</option><option value="0" ${p?.activo===false?'selected':''}>Inactivo</option></select></div></div>${textarea('Datos extra (JSON)','pl_extra',extra)}<div class="row" style="margin-top:15px"><button class="primary" onclick="guardarPlan('${esc(p?.id||'')}')">Guardar plan</button>${p?`<button class="danger" onclick="eliminarPlan('${esc(p.id)}')">Eliminar</button>`:''}</div>`}
window.nuevoPlan=()=>open('Agregar plan',planForm(null));window.editarPlan=id=>{const p=DATA.planes.find(x=>x.id===id);if(p)open('Editar plan',planForm(p))};
window.guardarPlan=async id=>{try{const extra=jsonParse(val('pl_extra'),{});const renta=num('pl_renta');if(renta!==null)extra.renta_mensual=renta;const payload={codigo:val('pl_codigo'),nombre:val('pl_nombre'),activo:val('pl_activo')==='1',datos_extra:extra};if(val('pl_orden')!=='')payload.orden=Number(val('pl_orden'));let r=id?await db.from('planes').update(payload).eq('id',id):await db.from('planes').insert(payload);if(r.error)throw r.error;await reload();cerrarModal()}catch(e){alert('No se pudo guardar el plan: '+e.message)}};
window.eliminarPlan=async id=>{if(!confirm('¿Eliminar definitivamente este plan? Si tiene precios relacionados, Supabase puede impedirlo. Es más seguro desactivarlo.'))return;const r=await db.from('planes').delete().eq('id',id);if(r.error)return alert(r.error.message);await reload();cerrarModal()};
function servicioForm(s){return `<div class="grid">${field('Código','sv_codigo',s?.codigo||'', 'text',s?'readonly':'')}${field('Nombre','sv_nombre',s?.nombre||'')}${field('Precio','sv_precio',s?.precio??'','number','step="0.01"')}<div><label>Estado</label><select id="sv_activo"><option value="1" ${s?.activo!==false?'selected':''}>Activo</option><option value="0" ${s?.activo===false?'selected':''}>Inactivo</option></select></div></div>${textarea('Configuración (JSON)','sv_config',JSON.stringify(s?.configuracion||{},null,2),'Seguro AT&T usa tiers; Control de Datos puede usar precio_fijo.')}<div class="row" style="margin-top:15px"><button class="primary" onclick="guardarServicio('${esc(s?.id||'')}')">Guardar servicio</button>${s?`<button class="danger" onclick="eliminarServicio('${esc(s.id)}')">Eliminar</button>`:''}</div>`}
window.nuevoServicio=()=>open('Agregar servicio',servicioForm(null));window.editarServicio=id=>{const s=DATA.servicios.find(x=>x.id===id);if(s)open('Editar servicio',servicioForm(s))};
window.guardarServicio=async id=>{try{const payload={codigo:val('sv_codigo'),nombre:val('sv_nombre'),precio:num('sv_precio'),activo:val('sv_activo')==='1',configuracion:jsonParse(val('sv_config'),{})};let r=id?await db.from('servicios').update(payload).eq('id',id):await db.from('servicios').insert(payload);if(r.error)throw r.error;await reload();cerrarModal()}catch(e){alert('No se pudo guardar el servicio: '+e.message)}};window.eliminarServicio=async id=>{if(!confirm('¿Eliminar este servicio?'))return;const r=await db.from('servicios').delete().eq('id',id);if(r.error)return alert(r.error.message);await reload();cerrarModal()};
function vigForm(v){return `<div class="grid">${field('Nombre','vg_nombre',v?.nombre||'')}${field('Fecha inicio','vg_ini',v?.fecha_inicio||'','date')}${field('Fecha fin','vg_fin',v?.fecha_fin||'','date')}<div><label>Estado</label><select id="vg_activa"><option value="1" ${v?.activa!==false?'selected':''}>Activa</option><option value="0" ${v?.activa===false?'selected':''}>Inactiva</option></select></div></div><div class="row" style="margin-top:15px"><button class="primary" onclick="guardarVigencia('${esc(v?.id||'')}')">Guardar vigencia</button></div>`}
window.editarVigencia=id=>{const v=DATA.vigencias.find(x=>x.id===id);if(v)open('Editar vigencia',vigForm(v))};window.guardarVigencia=async id=>{const payload={nombre:val('vg_nombre'),fecha_inicio:val('vg_ini')||null,fecha_fin:val('vg_fin')||null,activa:val('vg_activa')==='1'};const r=await db.from('vigencias').update(payload).eq('id',id);if(r.error)return alert(r.error.message);await reload();cerrarModal()};
$('buscarEquipo').addEventListener('input',renderEquipos);document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('on'));document.querySelectorAll('.section').forEach(x=>x.classList.remove('on'));b.classList.add('on');$('sec-'+b.dataset.tab).classList.add('on')});
reload().catch(e=>{console.error(e);msg('ERROR: '+(e.message||e),'danger')});
})();
