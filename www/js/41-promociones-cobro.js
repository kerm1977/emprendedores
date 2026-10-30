var CobroPromociones = Object.freeze({
    habilitado: false,
    iniciar: async function () {
        throw new Error('Cobro integrado deshabilitado. No se realizó ningún cargo. Utilizá la verificación del superusuario.');
    }
});
