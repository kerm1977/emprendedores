/* 26-google.js - Login/registro con Google OAuth nativo.
   El plugin Capacitor usa Play Services en la app instalada;
   en navegador avisa que solo funciona en la APK. */

async function loginGoogle() {
    var ok = window.Capacitor && Capacitor.Plugins &&
             Capacitor.Plugins.GoogleAuth;
    if (!ok) {
        showToast('Google login disponible en la app instalada');
        return;
    }
    try {
        var g = await Capacitor.Plugins.GoogleAuth.signIn();
        var token = g.idToken ||
            (g.authentication && g.authentication.idToken) || '';
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
            /* Muestra el error real: falta serverClientId, SHA-1, etc. */
            showToast('Google: ' + (msg || 'no pudo iniciar'));
            console.warn('loginGoogle error:', e);
        }
    }
}
