(function () {

    function cargar() {

        const estado = document.getElementById('estado');
        const version = document.getElementById('version');

        if (!window.CATALOGO_CONFIG) {

            estado.className = 'status danger';
            estado.textContent =
                'ERROR: No se pudo cargar catalog-data.js';

            return;
        }

        version.value =
            window.CATALOGO_CONFIG.version || '1.0.0';

        estado.className = 'status success';

        estado.innerHTML =
            '✓ Sistema independiente cargado correctamente.<br>' +
            'Todavía no hemos conectado los precios del catálogo original.';

    }


    window.guardarConfiguracion = function () {

        const version =
            document.getElementById('version').value.trim();

        window.CATALOGO_CONFIG.version =
            version || '1.0.0';

        document.getElementById('estado').className =
            'status success';

        document.getElementById('estado').textContent =
            '✓ Configuración cargada en memoria.';

        console.log(
            'CATALOGO_CONFIG:',
            window.CATALOGO_CONFIG
        );
    };


    cargar();

})();
