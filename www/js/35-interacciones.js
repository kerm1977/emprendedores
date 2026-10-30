function ampliarImagenPerfil(img) {
    var src = urlLogoNegocio(img.currentSrc || img.src);
    if (!src || document.getElementById('imagen-ampliada')) return;
    var previo = document.activeElement, overflow = document.body.style.overflow;
    var ov = document.createElement('div');
    ov.id = 'imagen-ampliada'; ov.className = 'imagen-ampliada';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', 'Imagen ampliada');
    var foto = document.createElement('img'); foto.src = src; foto.alt = img.alt || 'Imagen ampliada';
    var cerrar = document.createElement('button'); cerrar.type = 'button';
    cerrar.textContent = 'Cerrar'; cerrar.setAttribute('aria-label', 'Cerrar imagen ampliada');
    var salir = function () {
        ov.remove(); document.body.style.overflow = overflow;
        if (previo && previo.isConnected) previo.focus({ preventScroll: true });
    };
    cerrar.onclick = salir;
    ov.onclick = function (ev) { if (ev.target === ov) salir(); };
    ov.onkeydown = function (ev) {
        if (ev.key === 'Escape') salir();
        if (ev.key === 'Tab') { ev.preventDefault(); cerrar.focus(); }
    };
    ov.append(foto, cerrar); document.body.appendChild(ov);
    document.body.style.overflow = 'hidden'; cerrar.focus({ preventScroll: true });
}

document.addEventListener('click', function (ev) {
    var img = ev.target.closest('.perfil-avatar img, .emprend-logo img, #det-logo, .topbar-avatar img, #perfil-top img');
    if (!img) return;
    ev.preventDefault(); ev.stopPropagation(); ampliarImagenPerfil(img);
}, true);

document.addEventListener('click', function (ev) {
    if (!ev.target.closest('.topbar-logo')) return;
    ev.preventDefault();
    irAVista('view-inicio', 'Inicio');
    location.reload();
}, true);
