/* 48-wysiwyg.js - Mini editor WYSIWYG local (sin CDN).
   Toolbar: negrita, italica, subrayado, alinear izq/centro/der,
   viñetas y lista numerada. Devuelve texto plano para las
   notificaciones (que se muestran con escapeHtml). */

function wysiwygEditor(placeholder) {
    var box = document.createElement('div');
    box.className = 'wysiwyg';
    var bar = document.createElement('div');
    bar.className = 'wysiwyg-bar';
    bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px';
    var ed = document.createElement('div');
    ed.contentEditable = 'true';
    ed.className = 'wysiwyg-area';
    ed.style.cssText = 'min-height:130px;max-height:300px;overflow-y:auto;border:1px solid var(--border-soft);border-radius:10px;padding:10px;background:var(--bg-soft);color:var(--text-dark)';
    ed.dataset.placeholder = placeholder || '';
    var comandos = [
        ['bold', 'fa-bold', 'Negrita'], ['italic', 'fa-italic', 'Itálica'],
        ['underline', 'fa-underline', 'Subrayado'],
        ['justifyLeft', 'fa-align-left', 'Alinear a la izquierda'],
        ['justifyCenter', 'fa-align-center', 'Centrar'],
        ['justifyRight', 'fa-align-right', 'Alinear a la derecha'],
        ['insertUnorderedList', 'fa-list-ul', 'Viñetas'],
        ['insertOrderedList', 'fa-list-ol', 'Lista numerada']];
    comandos.forEach(function (c) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'rep-cancelar';
        b.style.cssText = 'padding:6px 10px;margin:0';
        b.innerHTML = '<i class="fas ' + c[1] + '"></i>';
        b.title = c[2];
        b.onmousedown = function (ev) {
            ev.preventDefault();
            document.execCommand(c[0], false, null);
            ed.focus();
        };
        bar.appendChild(b);
    });
    function marcarVacio() {
        if (!ed.innerText.trim()) {
            ed.dataset.vacio = '1';
            ed.innerHTML = '<span style="color:var(--text-soft)">' + escapeHtml(ed.dataset.placeholder) + '</span>';
        } else if (ed.dataset.vacio) {
            ed.innerHTML = '';
            delete ed.dataset.vacio;
        }
    }
    if (placeholder) marcarVacio();
    ed.addEventListener('focus', function () {
        if (ed.dataset.vacio) { ed.innerHTML = ''; delete ed.dataset.vacio; }
    });
    ed.addEventListener('blur', marcarVacio);
    box.appendChild(bar);
    box.appendChild(ed);
    box.texto = function () { return (ed.dataset.vacio ? '' : ed.innerText.trim()); };
    box.area = ed;
    return box;
}
