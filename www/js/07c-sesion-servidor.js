(function () {
    var original = window.fetch.bind(window);
    window.fetch = function (input, opciones) {
        var destino;
        try { destino = new URL(typeof input === 'string' ? input : input.url, location.href); }
        catch (error) { return original(input, opciones); }
        var api = new URL(apiUrl('/api/'), location.href);
        if (destino.origin === api.origin && destino.pathname.indexOf('/api/') === 0 && sesion && !sesion.offline) {
            var token = sesion.user && sesion.user.promo_token;
            if (token) {
                opciones = Object.assign({}, opciones);
                var headers = new Headers(opciones.headers || (typeof input !== 'string' && input.headers) || {});
                if (!headers.has('Authorization')) headers.set('Authorization', 'Bearer ' + token);
                opciones.headers = headers;
            }
        }
        return original(input, opciones);
    };
})();
