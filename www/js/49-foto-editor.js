/* 49-foto-editor.js - Editor local de foto de perfil (sin CDN).
   Al tocar el avatar: elegir imagen, arrastrarla libremente en X/Y,
   ajustar zoom y guardar via /api/uploads + PUT /api/usuarios. */

function prepararFotoEditor() {
    var av = document.querySelector('#view-perfil .perfil-avatar');
    if (!av || av.dataset.editor) return;
    av.dataset.editor = '1';
    mostrarFotoPerfil(av);
    av.style.cursor = 'pointer';
    av.title = 'Cambiar foto de perfil';
    av.onclick = function () {
        if (usuarioActual()) abrirEditorFoto(av);
    };
}

function mostrarFotoPerfil(av) {
    av = av || document.querySelector('#view-perfil .perfil-avatar');
    var u = usuarioActual();
    if (av && u && u.foto) {
        av.innerHTML = '<img src="' + escapeHtml(apiUrl(u.foto)) + '" alt="foto de perfil" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
    }
}

function abrirEditorFoto(av) {
    var ov = document.createElement('div');
    ov.className = 'modal-cat';
    ov.innerHTML = '<div class="modal-cat-hoja edita-hoja">' +
        '<h3><i class="fas fa-image"></i> Editar foto de perfil</h3>' +
        '<input type="file" id="fe-archivo" accept="image/*" hidden>' +
        '<label for="fe-archivo" class="emp-btn-guardar" style="display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer"><i class="fas fa-image"></i> Elegir imagen</label>' +
        '<canvas id="fe-canvas" width="300" height="300" style="display:block;margin:12px auto;border-radius:50%;border:2px solid var(--primary-color);touch-action:none;cursor:grab"></canvas>' +
        '<label>Zoom <input type="range" id="fe-zoom" min="50" max="300" value="100" style="width:100%"></label>' +
        '<p class="rep-sub">Arrastrá la imagen para centrarla y ajustá el tamaño con el zoom.</p>' +
        '<button class="emp-btn-guardar" id="fe-guardar" disabled>Guardar foto</button>' +
        '<button class="rep-cancelar" id="fe-cerrar">Cancelar</button></div>';
    document.body.appendChild(ov);
    var cv = ov.querySelector('#fe-canvas'), ctx = cv.getContext('2d');
    var img = null, ox = 0, oy = 0, arrastre = null;
    var zoom = ov.querySelector('#fe-zoom'), guardar = ov.querySelector('#fe-guardar');
    function base() { return img ? Math.max(cv.width / img.width, cv.height / img.height) : 1; }
    function pintar() {
        ctx.clearRect(0, 0, cv.width, cv.height);
        if (!img) { ctx.fillStyle = 'rgba(0,0,0,.05)'; ctx.fillRect(0, 0, cv.width, cv.height); return; }
        var s = base() * (zoom.value / 100);
        var w = img.width * s, h = img.height * s;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cv.width / 2, cv.height / 2, cv.width / 2 - 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, ox + cv.width / 2 - w / 2, oy + cv.height / 2 - h / 2, w, h);
        ctx.restore();
    }
    pintar();
    ov.querySelector('#fe-archivo').onchange = function (e) {
        var f = e.target.files[0];
        if (!f) return;
        var u = URL.createObjectURL(f);
        img = new Image();
        img.onload = function () { ox = oy = 0; zoom.value = 100; guardar.disabled = false; pintar(); };
        img.src = u;
    };
    cv.addEventListener('pointerdown', function (e) {
        if (!img) return;
        arrastre = { x: e.clientX, y: e.clientY, ox: ox, oy: oy };
        cv.setPointerCapture(e.pointerId);
        cv.style.cursor = 'grabbing';
    });
    cv.addEventListener('pointermove', function (e) {
        if (!arrastre) return;
        ox = arrastre.ox + (e.clientX - arrastre.x);
        oy = arrastre.oy + (e.clientY - arrastre.y);
        pintar();
    });
    ['pointerup', 'pointercancel'].forEach(function (t) {
        cv.addEventListener(t, function () { arrastre = null; cv.style.cursor = 'grab'; });
    });
    zoom.oninput = pintar;
    ov.querySelector('#fe-cerrar').onclick = function () { ov.remove(); };
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    guardar.onclick = async function () {
        guardar.disabled = true;
        try {
            var u = usuarioActual();
            var data = cv.toDataURL('image/jpeg', .9);
            var url = await subirFotoPerfil(data, u.id);
            var res = await fetch(apiUrl('/api/usuarios/' + u.id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ foto: url }) });
            var json = await res.json().catch(function () { return {}; });
            var confirmada = res.ok && ((json.user && json.user.foto === url) || (json.usuario && json.usuario.foto === url) || JSON.stringify(json).indexOf(url) !== -1);
            if (!confirmada) throw new Error(json.error || ('El servidor no confirmó la foto (HTTP ' + res.status + ')'));
            u.foto = url;
            mostrarFotoPerfil(av);
            ov.remove();
            showToast('Foto de perfil actualizada');
        } catch (e) {
            guardar.disabled = false;
            showToast(e.message || 'No se pudo guardar la foto');
        }
    };
}
