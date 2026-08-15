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

    const editor =
        document.getElementById('editorEquipo');

    if (!editor) return;


    const precios =
        window.CATALOGO_CONFIG &&
        window.CATALOGO_CONFIG.precios
            ? window.CATALOGO_CONFIG.precios[id]
            : null;


    const equipo =
        window.CATALOGO_CONFIG &&
        Array.isArray(window.CATALOGO_CONFIG.equipos)
            ? window.CATALOGO_CONFIG.equipos.find(
                function (item) {
                    return item.id === id;
                }
            )
            : null;


    if (!precios) {

        editor.style.display = 'block';

        editor.innerHTML =
            '<div class="status danger">' +
            'No encontramos precios para el equipo ' +
            escapeHtml(id) +
            '</div>';

        return;
    }


    const nombre =
        equipo
            ? (
                equipo.name ||
                equipo.nombre ||
                id
            )
            : id;


    const marca =
        equipo
            ? (
                equipo.brand ||
                equipo.marca ||
                ''
            )
            : '';


    const storage =
        equipo
            ? (
                equipo.storage ||
                ''
            )
            : '';


    const vigencia =
        window.CATALOGO_CONFIG.vigencias &&
        window.CATALOGO_CONFIG.vigencias[id]
            ? window.CATALOGO_CONFIG.vigencias[id]
            : '';


    const planes =
        window.CATALOGO_CONFIG.planes || [];


    let html = '';


    html += `
        <div
            style="
                border:2px solid #111;
                border-radius:12px;
                padding:20px;
                background:#fafafa;
            "
        >

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:flex-start;
                    gap:15px;
                    margin-bottom:20px;
                "
            >

                <div>

                    <h2 style="margin:0;">
                        ${escapeHtml(nombre)}
                    </h2>

                    <div
                        style="
                            margin-top:6px;
                            color:#666;
                        "
                    >
                        ${escapeHtml(marca)}
                        ${marca ? ' · ' : ''}
                        ${escapeHtml(storage)}
                    </div>

                    <div
                        style="
                            margin-top:5px;
                            color:#777;
                            font-size:13px;
                        "
                    >
                        ID: ${escapeHtml(id)}
                    </div>

                </div>

                <button
                    type="button"
                    onclick="cerrarEditorEquipo()"
                >
                    Cerrar
                </button>

            </div>


            <div
                style="
                    background:white;
                    border:1px solid #ddd;
                    border-radius:10px;
                    padding:15px;
                    margin-bottom:15px;
                "
            >

                <h3 style="margin-top:0;">
                    💰 Precio de contado
                </h3>

                <input
                    id="precioContado"
                    type="number"
                    step="0.01"
                    value="${precios.contado ?? ''}"
                >

            </div>


            <h3>
                📋 Precios por plan
            </h3>
    `;


    planes.forEach(function (plan) {

        const nombrePlan =
            plan.name;


        const datosPlan =
            precios.planes &&
            precios.planes[nombrePlan]
                ? precios.planes[nombrePlan]
                : {
                    24: null,
                    30: null,
                    36: null
                };


        html += `
            <div
                style="
                    background:white;
                    border:1px solid #ddd;
                    border-radius:10px;
                    padding:15px;
                    margin-bottom:12px;
                "
            >

                <h3
                    style="
                        margin-top:0;
                        margin-bottom:12px;
                    "
                >
                    ${escapeHtml(nombrePlan)}
                </h3>

                <div class="grid">

                    <div>

                        <label>
                            24 meses
                        </label>

                        <input
                            id="precio_${id}_${nombrePlan}_24"
                            type="number"
                            step="0.01"
                            value="${datosPlan[24] ?? ''}"
                        >

                    </div>


                    <div>

                        <label>
                            30 meses
                        </label>

                        <input
                            id="precio_${id}_${nombrePlan}_30"
                            type="number"
                            step="0.01"
                            value="${datosPlan[30] ?? ''}"
                        >

                    </div>


                    <div>

                        <label>
                            36 meses
                        </label>

                        <input
                            id="precio_${id}_${nombrePlan}_36"
                            type="number"
                            step="0.01"
                            value="${datosPlan[36] ?? ''}"
                        >

                    </div>

                </div>

            </div>
        `;

    });


    html += `

            <div
                style="
                    background:white;
                    border:1px solid #ddd;
                    border-radius:10px;
                    padding:15px;
                "
            >

                <h3 style="margin-top:0;">
                    📅 Vigencia
                </h3>

                <input
                    id="vigenciaEquipo"
                    type="text"
                    value="${escapeHtml(vigencia)}"
                    placeholder="Ejemplo: 2026-08-31"
                >

            </div>


            <div
                style="
                    margin-top:20px;
                    display:flex;
                    gap:10px;
                    flex-wrap:wrap;
                "
            >

                <button
                    type="button"
                    class="primary"
                    onclick="guardarPreciosEquipo('${escapeHtml(id)}')"
                >
                    💾 Guardar cambios
                </button>

                <button
                    type="button"
                    onclick="cerrarEditorEquipo()"
                >
                    Cancelar
                </button>

            </div>


            <div
                id="mensajeEditor"
                style="margin-top:15px;"
            >
            </div>

        </div>
    `;


    editor.innerHTML = html;

    editor.style.display = 'block';


    editor.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });

};

    window.cerrarEditorEquipo = function () {

    const editor =
        document.getElementById('editorEquipo');

    if (!editor) return;

    editor.style.display = 'none';
    editor.innerHTML = '';

};


window.guardarPreciosEquipo = function (id) {

    const datos =
        window.CATALOGO_CONFIG.precios[id];

    if (!datos) {

        alert(
            'No encontramos los datos del equipo.'
        );

        return;
    }


    /*
     * PRECIO DE CONTADO
     */

    const contado =
        document.getElementById(
            'precioContado'
        );

    if (contado) {

        const valor =
            contado.value.trim();

        datos.contado =
            valor === ''
                ? null
                : Number(valor);

    }


    /*
     * PRECIOS DE LOS PLANES
     */

    const planes =
        window.CATALOGO_CONFIG.planes || [];


    planes.forEach(function (plan) {

        const nombrePlan =
            plan.name;


        if (!datos.planes) {

            datos.planes = {};

        }


        if (!datos.planes[nombrePlan]) {

            datos.planes[nombrePlan] = {
                24: null,
                30: null,
                36: null
            };

        }


        [24, 30, 36].forEach(function (plazo) {

            const input =
                document.getElementById(
                    `precio_${id}_${nombrePlan}_${plazo}`
                );


            if (!input) return;


            const valor =
                input.value.trim();


            datos.planes[nombrePlan][plazo] =
                valor === ''
                    ? null
                    : Number(valor);

        });

    });


    /*
     * VIGENCIA
     */

    const vigencia =
        document.getElementById(
            'vigenciaEquipo'
        );


    if (vigencia) {

        window.CATALOGO_CONFIG.vigencias[id] =
            vigencia.value.trim();

    }


    /*
     * MENSAJE
     */

    const mensaje =
        document.getElementById(
            'mensajeEditor'
        );


    if (mensaje) {

        mensaje.className =
            'status success';

        mensaje.innerHTML =
            '✓ Cambios realizados correctamente.' +
            '<br><small>' +
            'El cambio está actualmente en memoria. ' +
            'Todavía no hemos modificado catalog.js.' +
            '</small>';

    }


    console.log(
        'Precios actualizados:',
        id,
        datos
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
