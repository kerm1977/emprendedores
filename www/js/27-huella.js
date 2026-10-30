/* 27-huella.js - Ingreso por huella digital (biometrico nativo,
   100% local, sin nube). Plugin: @aparajita/capacitor-biometric-auth.
   Flujo: login normal una vez -> Perfil "Activar huella" -> en el
   login el boton "Entrar con huella" restaura la sesion al instante. */

var HUELLA_KEY = 'emprende-huella-on';

async function huellaDisponible() {
    var BA = window.Capacitor && Capacitor.Plugins &&
             Capacitor.Plugins.BiometricAuth;
    if (!BA) return false;
    try {
        var r = await BA.checkBiometry();
        /* sensores debiles (muchos Samsung/Huawei) no pasan el
           chequeo fuerte pero SI tienen huella utilizable */
        return !!(r && (r.isAvailable || r.strongBiometryIsAvailable ||
                  (r.biometryTypes && r.biometryTypes.length > 0) ||
                  r.deviceIsSecure));
    } catch (e) { return false; }
}

/* Enrolar: se llama desde Perfil tras un login exitoso */
async function activarHuella() {
    var BA = window.Capacitor && Capacitor.Plugins &&
             Capacitor.Plugins.BiometricAuth;
    if (!BA) {
        showToast('Huella disponible solo en la app instalada');
        return;
    }
    try {
        /* directo al prompt nativo: el sistema decide si hay
           huella/rostro/PIN; el chequeo previo fallaba */
        await Capacitor.Plugins.BiometricAuth.authenticate({
            reason: 'Confirmar huella para ingresar rapido',
            cancelTitle: 'Cancelar',
            androidTitle: 'Emprendedores',
            androidSubtitle: 'Activar ingreso por huella',
            androidConfirmationRequired: true,
            allowDeviceCredential: true
        });
        await localforage.setItem(HUELLA_KEY, true);
        showToast('Huella activada: proximo login directo');
        var b = document.getElementById('btn-huella-perfil');
        if (b) b.hidden = true;
    } catch (e) {
        var m = (e && e.message) || '';
        showToast(m.indexOf('not available') !== -1 ||
                  m.indexOf('No hardware') !== -1
            ? 'Este dispositivo no tiene biometría'
            : 'No se activó la huella');
        console.warn('huella:', e);
    }
}

/* En el login: boton "Entrar con huella" */
async function entrarConHuella() {
    var activa = await localforage.getItem(HUELLA_KEY);
    if (!activa) {
        showToast('Primero ingresá normal y activá la huella en Perfil');
        return;
    }
    var last = await localforage.getItem(LASTLOGIN_KEY);
    if (!last || !last.user) {
        showToast('No hay sesión guardada para la huella');
        return;
    }
    try {
        await Capacitor.Plugins.BiometricAuth.authenticate({
            reason: 'Ingresar a Emprendedores',
            cancelTitle: 'Cancelar',
            androidTitle: 'Emprendedores',
            androidSubtitle: 'Verificá tu identidad',
            androidConfirmationRequired: true,
            allowDeviceCredential: true
        });
        /* Huella correcta: restaurar la sesion cacheada */
        sesion = { user: last.user, pass_hash: last.pass_hash };
        await localforage.setItem(SESION_KEY, sesion);
        if (typeof ocultarLogin === 'function') ocultarLogin();
        renderTodo();
        showToast('¡Hola, ' + (last.user.nombre || '') + '!');
    } catch (e) {
        /* cancelado o fallo de hardware */
    }
}
