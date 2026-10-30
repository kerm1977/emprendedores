/* BLINDADO (orden del usuario): prohibido modificar/eliminar
   sin orden explicita. Pedir permiso antes de tocar. */
/* ==========================================================
   BLINDADO TOTAL (orden del usuario): login con Google YA
   FUNCIONA. Prohibido tocar este modulo, el plugin
   @capgo/capacitor-social-login, el webClientId,
   android/app/google-services.json (ambos clientes
   web+android), ni MainActivity (interfaz marcador).
   Solo cambiar si hay una orden explicita del usuario.
   ========================================================== */
/* 26-google.js - Login/registro con Google OAuth nativo.
   Plugin: @capgo/capacitor-social-login (Capgo, mantenido).
   Requiere google-services.json con AMBOS clientes (web + android)
   y la app OAuth publicada. */

async function loginGoogle() {
    var SL = window.Capacitor && Capacitor.Plugins &&
             Capacitor.Plugins.SocialLogin;
    if (!SL) {
        showToast('Google login disponible en la app instalada');
        return;
    }
    try {
        await SL.initialize({
            google: {
                webClientId:
 '68651650199-vd3tjnqsul6bofjml2vlhiu9ueisg211.apps.googleusercontent.com'
            }
        });
        var resp = await SL.login({
            provider: 'google',
            options: {
                /* muestra todas las cuentas, sin filtro */
                filterByAuthorizedAccounts: false,
                scopes: ['profile', 'email']
            }
        });
        var token = (resp.result && resp.result.idToken) || '';
        var res = await fetch(apiUrl('/api/auth/google'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: token })
        });
        var data = await res.json();
        if (!res.ok || !data.user) {
            showToast(data.error || 'No se pudo acceder con Google');
            return;
        }
        await guardarSesion(data.user, 'google-oauth');
        if (typeof ocultarLogin === 'function') ocultarLogin();
        renderTodo();
        showToast('¡Hola, ' + (data.user.nombre || '') + '!');
    } catch (e) {
        var msg = (e && e.message) || String(e);
        if (msg.indexOf('cancel') === -1 && msg.indexOf('Cancel') === -1) {
            showToast('Google: ' + (msg || 'no pudo iniciar'));
            console.warn('loginGoogle error:', e);
        }
    }
}
