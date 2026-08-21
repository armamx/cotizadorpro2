// ============================================================
// SUPABASE CATALOG - COTIZADOR PRO
// FUENTE NUEVA DE DATOS
// ============================================================

const SUPABASE_URL = "https://fnjayhjdpyurbfevkhpg.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_Pqw59cE1lGrAbu23gRmchw_HcLRkhUO";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// ============================================================
// CONFIGURACIÓN
// ============================================================

const SUPABASE_PAGE_SIZE = 1000;


// ============================================================
// CARGAR TODOS LOS REGISTROS DE UNA TABLA
// ============================================================

async function cargarTodosSupabase(tabla, select = "*") {

    let todos = [];
    let desde = 0;

    while (true) {

        const hasta = desde + SUPABASE_PAGE_SIZE - 1;

        const { data, error } = await supabaseClient
            .from(tabla)
            .select(select)
            .range(desde, hasta);

        if (error) {
            console.error(
                `❌ Error cargando tabla ${tabla}:`,
                error
            );

            throw error;
        }

        if (!data || data.length === 0) {
            break;
        }

        todos = todos.concat(data);

        if (data.length < SUPABASE_PAGE_SIZE) {
            break;
        }

        desde += SUPABASE_PAGE_SIZE;
    }

    return todos;
}


// ============================================================
// CARGAR CATÁLOGO COMPLETO
// ============================================================

async function cargarCatalogoSupabase() {

    console.log("🔄 Cargando catálogo desde Supabase...");

    const [
        equipos,
        planes,
        planPlazos,
        vigencias,
        precios
    ] = await Promise.all([

        cargarTodosSupabase(
            "equipos",
            "*"
        ),

        cargarTodosSupabase(
            "planes",
            "*"
        ),

        cargarTodosSupabase(
            "plan_plazos",
            "*"
        ),

        cargarTodosSupabase(
            "vigencias",
            "*"
        ),

        cargarTodosSupabase(
            "precios",
            "*"
        )

    ]);


    // ========================================================
    // FILTRAR REGISTROS ACTIVOS
    // ========================================================

    const equiposActivos = equipos.filter(
        equipo => equipo.activo === true
    );

    const planesActivos = planes.filter(
        plan => plan.activo === true
    );

    const plazosActivos = planPlazos.filter(
        plazo => plazo.activo === true
    );

    const preciosActivos = precios.filter(
        precio => precio.activo === true
    );

    const vigenciasActivas = vigencias.filter(
        vigencia => vigencia.activa === true
    );


    // ========================================================
    // ÍNDICES PARA BÚSQUEDA RÁPIDA
    // ========================================================

    const equiposPorId = new Map();

    const equiposPorCodigo = new Map();

    const planesPorId = new Map();

    const plazosPorId = new Map();

    const vigenciasPorId = new Map();


    equiposActivos.forEach(equipo => {

        equiposPorId.set(
            equipo.id,
            equipo
        );

        equiposPorCodigo.set(
            equipo.codigo,
            equipo
        );

    });


    planesActivos.forEach(plan => {

        planesPorId.set(
            plan.id,
            plan
        );

    });


    plazosActivos.forEach(plazo => {

        plazosPorId.set(
            plazo.id,
            plazo
        );

    });


    vigenciasActivas.forEach(vigencia => {

        vigenciasPorId.set(
            vigencia.id,
            vigencia
        );

    });


    // ========================================================
    // PRECIOS ENRIQUECIDOS
    // ========================================================

    const preciosEnriquecidos = preciosActivos.map(precio => {

        const equipo =
            equiposPorId.get(precio.equipo_id) || null;

        const plan =
            planesPorId.get(precio.plan_id) || null;

        const plazo =
            plazosPorId.get(precio.plazo_id) || null;

        const vigencia =
            vigenciasPorId.get(precio.vigencia_id) || null;


        return {

            ...precio,

            equipo: equipo,

            plan: plan,

            plazo: plazo,

            vigencia: vigencia,

            codigo:
                equipo?.codigo || null,

            equipo_nombre:
                equipo?.nombre || null,

            plan_codigo:
                plan?.codigo || null,

            plan_nombre:
                plan?.nombre || null,

            meses:
                plazo?.meses ?? null,

            vigencia_nombre:
                vigencia?.nombre || null,

            fecha_inicio:
                vigencia?.fecha_inicio || null,

            fecha_fin:
                vigencia?.fecha_fin || null

        };

    });


    // ========================================================
    // PRECIOS AGRUPADOS POR EQUIPO
    // ========================================================

    const preciosPorEquipo = new Map();


    preciosEnriquecidos.forEach(precio => {

        const equipoId = precio.equipo_id;

        if (!preciosPorEquipo.has(equipoId)) {
            preciosPorEquipo.set(
                equipoId,
                []
            );
        }

        preciosPorEquipo
            .get(equipoId)
            .push(precio);

    });


    // ========================================================
    // EQUIPOS ENRIQUECIDOS
    // ========================================================

    const equiposCompletos = equiposActivos.map(equipo => {

        const preciosEquipo =
            preciosPorEquipo.get(equipo.id) || [];


        return {

            ...equipo,

            precios:
                preciosEquipo,

            imagen:
                equipo.imagen_url || null,

            specs:
                equipo.especificaciones || {},

            argumentos:
                equipo.argumentos_venta || [],

            objeciones:
                equipo.objeciones || [],

            extra:
                equipo.datos_extra || {}

        };

    });


    // ========================================================
    // OBJETO FINAL DEL CATÁLOGO
    // ========================================================

    const catalogo = {

        version: "supabase",

        fecha_carga:
            new Date().toISOString(),

        equipos:
            equiposCompletos,

        planes:
            planesActivos,

        plazos:
            plazosActivos,

        vigencias:
            vigenciasActivas,

        precios:
            preciosEnriquecidos,

        indices: {

            equiposPorId:
                equiposPorId,

            equiposPorCodigo:
                equiposPorCodigo,

            planesPorId:
                planesPorId,

            plazosPorId:
                plazosPorId,

            vigenciasPorId:
                vigenciasPorId,

            preciosPorEquipo:
                preciosPorEquipo

        }

    };


    // ========================================================
    // DISPONIBLE GLOBALMENTE
    // ========================================================

    window.SUPABASE_CATALOGO =
        catalogo;


    window.EQUIPOS_SUPABASE =
        equiposCompletos;


    window.PLANES_SUPABASE =
        planesActivos;


    window.PLAZOS_SUPABASE =
        plazosActivos;


    window.VIGENCIAS_SUPABASE =
        vigenciasActivas;


    window.PRECIOS_SUPABASE =
        preciosEnriquecidos;


    // ========================================================
    // RESUMEN
    // ========================================================

    console.log(
        "============================================"
    );

    console.log(
        "✅ CATÁLOGO SUPABASE CARGADO"
    );

    console.log(
        "============================================"
    );

    console.log(
        "📱 Equipos:",
        equiposActivos.length
    );

    console.log(
        "📋 Planes:",
        planesActivos.length
    );

    console.log(
        "📆 Plazos:",
        plazosActivos.length
    );

    console.log(
        "📅 Vigencias:",
        vigenciasActivas.length
    );

    console.log(
        "💰 Precios:",
        preciosActivos.length
    );

    console.log(
        "============================================"
    );


    return catalogo;
}


// ============================================================
// PROMESA GLOBAL DE CARGA
// ============================================================

window.SUPABASE_CATALOGO_READY =
    cargarCatalogoSupabase()
        .then(catalogo => {

            console.log(
                "🚀 Supabase Catalog READY"
            );

            console.log(
                "📱 EQUIPOS DISPONIBLES:",
                catalogo.equipos.length
            );

            console.log(
                "🔎 PRIMER EQUIPO:",
                catalogo.equipos[0]
            );

            return catalogo;

        })
        .catch(error => {

            console.error(
                "❌ Error cargando catálogo Supabase:",
                error
            );

            throw error;

        });
