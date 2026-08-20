// ============================================
// CONEXIÓN SUPABASE - COTIZADOR PRO
// ============================================

const SUPABASE_URL = "https://fnjayhjdpyurbfevkhpg.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Pqw59cE1lGrAbu23gRmchw_HcLRkhUO";

// Cliente Supabase
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// ============================================
// OBTENER EQUIPOS
// ============================================

async function obtenerEquiposSupabase() {

    const { data, error } = await supabaseClient
        .from("equipos")
        .select("*")
        .eq("activo", true)
        .order("nombre");

    if (error) {
        console.error("Error obteniendo equipos:", error);
        throw error;
    }

    return data || [];
}


// ============================================
// OBTENER UN EQUIPO
// ============================================

async function obtenerEquipoSupabase(codigo) {

    const { data, error } = await supabaseClient
        .from("equipos")
        .select("*")
        .eq("codigo", codigo)
        .maybeSingle();

    if (error) {
        console.error("Error obteniendo equipo:", error);
        throw error;
    }

    return data;
}

// PRUEBA DE CONEXIÓN SUPABASE
(async function () {
    try {
        const equipos = await obtenerEquiposSupabase();

        console.log(
            "✅ Supabase conectado. Equipos activos:",
            equipos.length
        );

        window.EQUIPOS_SUPABASE = equipos;

    } catch (error) {
        console.error(
            "❌ Error conectando con Supabase:",
            error
        );
    }
})();
