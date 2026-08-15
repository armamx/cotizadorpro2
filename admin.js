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


    /*
     * BUSCADOR DE EQUIPOS
     */

    function mostrarEquipos(filtro = '') {

        const contenedor =
            document.getElementById('listaEquipos');

        if (!contenedor) return;


        if (
            !window.CATALOGO_CONFIG ||
            !Array.isArray(window.CATALOGO_CONFIG.equipos)
        ) {

            contenedor.innerHTML =
                '<div class="status danger">' +
                'No hay equipos disponibles.' +
                '</div>';

            return;
        }


        const texto =
            filtro.trim().toLowerCase();


        const equipos =
            window.CATALOGO_CONFIG.equipos.filter(function (equipo) {

                const nombre =
                    String(
                        equipo.name ||
                        equipo.nombre ||
                        ''
                    ).toLowerCase();

                const marca =
                    String(
                        equipo.brand ||
                        equipo.marca ||
                        ''
                    ).toLowerCase();

                const id =
                    String(
                        equipo.id ||
                        ''
                    ).toLowerCase();


                return (
                    !texto ||
                    nombre.includes(texto) ||
                    marca.includes(texto) ||
                    id.includes(texto)
                );

            });


        if (!equipos.length) {

            contenedor.innerHTML =
                '<div class="status">' +
                'No encontramos equipos con "' +
                escapeHtml(filtro) +
                '".' +
                '</div>';

            return;
        }


        contenedor.innerHTML = equipos.map(function (equipo) {

            const id =
                equipo.id || '';

            const nombre =
                equipo.name ||
                equipo.nombre ||
                id;

            const marca =
                equipo.brand ||
                equipo.marca ||
                '';


            return `
                <div
                    class="card"
                    style="margin:10px 0; border:1px solid #ddd;"
                >

                    <strong>
                        ${escapeHtml(nombre)}
                    </strong>

                    <div style="margin-top:6px;color:#666;">
                        ${escapeHtml(marca)}
                        ${marca ? ' · ' : ''}
                        ID: ${escapeHtml(id)}
                    </div>

                    <div style="margin-top:12px;">

                        <button
                            class="primary"
                            onclick="seleccionarEquipo('${escapeHtml(id)}')"
                        >
                            Ver precios
                        </button>

                    </div>

                </div>
            `;

        }).join('');

    }


    /*
     * SELECCIONAR EQUIPO
     *
     * Por ahora solamente comprobamos que funciona.
     * En el siguiente paso mostraremos sus precios.
     */

    window.seleccionarEquipo = function (id) {

        console.log(
            'Equipo seleccionado:',
            id
        );

        alert(
            'Equipo seleccionado: ' +
            id +
            '\n\nEl siguiente paso será mostrar sus precios.'
        );

    };


    /*
     * ACTIVAR BUSCADOR
     */

    function activarBuscador() {

        const buscador =
            document.getElementById('buscarEquipo');

        if (!buscador) return;


        buscador.addEventListener(
            'input',
            function () {

                mostrarEquipos(
                    buscador.value
                );

            }
        );


        mostrarEquipos();

    }


    activarBuscador();

})();
