(function () {

    'use strict';

    /*
     * ADMINISTRADOR DE CATÁLOGO
     *
     * IMPORTANTE:
     * Esta primera versión SOLO LEE el catálogo actual.
     *
     * NO modifica:
     * - catalog.js
     * - app.js
     * - PRICES
     * - PLANS_DATA
     * - VIGENCY
     *
     * Estamos haciendo la migración de forma segura.
     */


    function inicializar() {

        const estado = document.getElementById('estado');
        const version = document.getElementById('version');

        try {

            /*
             * Comprobamos que catalog.js realmente haya cargado.
             */

            if (typeof PRICES === 'undefined') {
                throw new Error('PRICES no está disponible');
            }

            if (typeof PLANS_DATA === 'undefined') {
                throw new Error('PLANS_DATA no está disponible');
            }


            /*
             * Copiamos los datos actuales a nuestra nueva estructura.
             */

            window.CATALOGO_CONFIG = {

                version:
                    typeof CATALOG_META !== 'undefined'
                        ? CATALOG_META.version
                        : '1.0.0',

                catalog_date:
                    typeof CATALOG_META !== 'undefined'
                        ? CATALOG_META.catalog_date
                        : '',

                source:
                    typeof CATALOG_META !== 'undefined'
                        ? CATALOG_META.source
                        : '',

                planes:
                    typeof PLANS_DATA !== 'undefined'
                        ? JSON.parse(JSON.stringify(PLANS_DATA))
                        : [],

                precios:
                    typeof PRICES !== 'undefined'
                        ? JSON.parse(JSON.stringify(PRICES))
                        : {},

                vigencias:
                    typeof VIGENCY !== 'undefined'
                        ? JSON.parse(JSON.stringify(VIGENCY))
                        : {},

                preciosFuturos:
                    typeof FUTURE_PRICES !== 'undefined'
                        ? JSON.parse(JSON.stringify(FUTURE_PRICES))
                        : {},

                variantes:
                    typeof STORAGE_VARIANTS !== 'undefined'
                        ? JSON.parse(JSON.stringify(STORAGE_VARIANTS))
                        : {},

                equipos: []
            };


            /*
             * Intentamos obtener los equipos del catálogo.
             */

            if (typeof CAT !== 'undefined') {

                const ios =
                    Array.isArray(CAT.ios)
                        ? CAT.ios
                        : [];

                const android =
                    Array.isArray(CAT.android)
                        ? CAT.android
                        : [];

                window.CATALOGO_CONFIG.equipos =
                    JSON.parse(
                        JSON.stringify(
                            ios.concat(android)
                        )
                    );
            }


            /*
             * Mostrar información.
             */

            if (version) {
                version.value =
                    window.CATALOGO_CONFIG.version;
            }


            const totalEquipos =
                Object.keys(
                    window.CATALOGO_CONFIG.precios
                ).length;


            const totalPlanes =
                window.CATALOGO_CONFIG.planes.length;


            const totalVigencias =
                Object.keys(
                    window.CATALOGO_CONFIG.vigencias
                ).length;


            estado.className =
                'status success';


            estado.innerHTML =

                '✓ Catálogo actual cargado correctamente.<br><br>' +

                '<strong>Versión:</strong> ' +
                escapeHtml(
                    window.CATALOGO_CONFIG.version
                ) +

                '<br>' +

                '<strong>Fecha:</strong> ' +
                escapeHtml(
                    window.CATALOGO_CONFIG.catalog_date
                ) +

                '<br>' +

                '<strong>Fuente original:</strong> ' +
                escapeHtml(
                    window.CATALOGO_CONFIG.source
                ) +

                '<br><br>' +

                '<strong>Equipos con precios:</strong> ' +
                totalEquipos +

                '<br>' +

                '<strong>Planes:</strong> ' +
                totalPlanes +

                '<br>' +

                '<strong>Vigencias:</strong> ' +
                totalVigencias;


            console.log(
                'CATALOGO_CONFIG cargado:',
                window.CATALOGO_CONFIG
            );


        } catch (error) {

            console.error(
                'Error cargando catálogo:',
                error
            );


            estado.className =
                'status danger';


            estado.textContent =
                'ERROR: ' +
                error.message;
        }
    }


    function escapeHtml(valor) {

        return String(valor ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


    window.guardarConfiguracion = function () {

        if (!window.CATALOGO_CONFIG) {
            alert('El catálogo todavía no está cargado.');
            return;
        }


        const versionInput =
            document.getElementById('version');


        const nuevaVersion =
            versionInput.value.trim();


        if (!nuevaVersion) {
            alert('Escribe una versión.');
            return;
        }


        window.CATALOGO_CONFIG.version =
            nuevaVersion;


        const estado =
            document.getElementById('estado');


        estado.className =
            'status success';


        estado.textContent =
            '✓ Cambio realizado en memoria.';


        console.log(
            'Nueva configuración:',
            window.CATALOGO_CONFIG
        );
    };


    /*
     * Arrancar.
     */

    if (document.readyState === 'loading') {

        document.addEventListener(
            'DOMContentLoaded',
            inicializar
        );

    } else {

        inicializar();

    }

})();
