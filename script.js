// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = 'https://ywptlghrksvsvhiqqgcg.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3cHRsZ2hya3N2c3ZoaXFxZ2NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzA3MDgsImV4cCI6MjA5Mzc0NjcwOH0.nYwso3im2NfNHCPujIrzEo5nQm249pSgR8J3dlwYsSY';

// LE CAMBIAMOS EL NOMBRE A LA VARIABLE ACÁ:
const miSupabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let materiaSeleccionada = null;
let estadoTemporal = 'pendiente';
// Esta variable va a guardar la memoria de la base de datos para usarla rápido en pantalla
let memoriaMaterias = {}; 

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosGuardados();

    // Configurar clic en materias
    document.querySelectorAll('.materia').forEach(materia => {
        const activar = (e) => {
            e.stopPropagation();
            resetColors();
            materia.classList.add('selected');
            procesarCadena(materia.id, 'data-correlativas', 'previa');
            procesarCadena(materia.id, 'data-abre', 'siguiente');
            
            abrirPanel(materia);
        };
        materia.addEventListener('click', activar);
    });

    // Cerrar panel al hacer clic afuera
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('side-panel');
        if (!panel.contains(e.target) && !e.target.classList.contains('materia')) {
            resetColors();
            cerrarPanel();
        }
    });

    document.getElementById('close-panel').addEventListener('click', cerrarPanel);
    
    document.querySelectorAll('.btn-status').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-status').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            estadoTemporal = e.target.getAttribute('data-status');
            
            const sectionNota = document.getElementById('grade-section');
            if (estadoTemporal === 'final') {
                sectionNota.style.display = 'block';
            } else {
                sectionNota.style.display = 'none';
            }
        });
    });

    document.getElementById('save-btn').addEventListener('click', guardarMateria);
});

// --- LÓGICA DE CORRELATIVAS ---
function procesarCadena(id, atributo, tipo) {
    const el = document.getElementById(id);
    if (!el) return;
    const relaciones = (el.getAttribute(atributo) || "").split(" ").filter(i => i);
    relaciones.forEach(rel => {
        const [modo, targetId] = rel.split(":"); 
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
            const claseFinal = `${tipo}-final`;
            const claseCursada = `${tipo}-cursada`;
            if (modo === 'F') {
                targetEl.classList.remove(claseCursada);
                targetEl.classList.add(claseFinal);
            } else if (!targetEl.classList.contains(claseFinal)) {
                targetEl.classList.add(claseCursada);
            }
            procesarCadena(targetId, atributo, tipo);
        }
    });
}

function resetColors() {
    document.querySelectorAll('.materia').forEach(m => {
        m.classList.remove('selected', 'previa-final', 'previa-cursada', 'siguiente-final', 'siguiente-cursada');
    });
}

// --- LÓGICA DE PANEL Y BASE DE DATOS SUPABASE ---
function abrirPanel(materiaHTML) {
    materiaSeleccionada = materiaHTML.id;
    document.getElementById('panel-title').innerText = materiaHTML.innerText;
    
    // Leer de la memoria local que trajimos de Supabase
    const info = memoriaMaterias[materiaSeleccionada] || { estado: 'pendiente', nota: null };
    
    estadoTemporal = info.estado;
    
    document.querySelectorAll('.btn-status').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-status') === estadoTemporal);
    });
    
    const sectionNota = document.getElementById('grade-section');
    const inputNota = document.getElementById('grade-input');
    
    if (estadoTemporal === 'final') {
        sectionNota.style.display = 'block';
        inputNota.value = info.nota || '';
    } else {
        sectionNota.style.display = 'none';
        inputNota.value = '';
    }

    document.getElementById('side-panel').classList.add('open');
}

function cerrarPanel() {
    document.getElementById('side-panel').classList.remove('open');
    materiaSeleccionada = null;
}

// Acá le hablamos a Supabase para guardar (USANDO miSupabase)
async function guardarMateria() {
    if (!materiaSeleccionada) return;
    
    const btnGuardar = document.getElementById('save-btn');
    btnGuardar.innerText = "Guardando...";
    
    const inputNota = document.getElementById('grade-input');
    let notaValor = null;
    if (estadoTemporal === 'final' && inputNota.value !== '') {
        notaValor = parseFloat(inputNota.value);
    }

    try {
        if (estadoTemporal === 'pendiente') {
            await miSupabase
                .from('materias_progreso')
                .delete()
                .eq('materia_id', materiaSeleccionada);
                
            delete memoriaMaterias[materiaSeleccionada];
        } else {
            await miSupabase
                .from('materias_progreso')
                .upsert({ 
                    materia_id: materiaSeleccionada, 
                    estado: estadoTemporal, 
                    nota: notaValor 
                });
                
            memoriaMaterias[materiaSeleccionada] = { estado: estadoTemporal, nota: notaValor };
        }

        aplicarEstilosVisuales();
        cerrarPanel();
        resetColors();
    } catch (error) {
        alert("Hubo un error al guardar. Intentá de nuevo.");
        console.error(error);
    } finally {
        btnGuardar.innerText = "Guardar Cambios";
    }
}

// Acá le hablamos a Supabase al cargar la página (USANDO miSupabase)
async function cargarDatosGuardados() {
    try {
        const { data, error } = await miSupabase
            .from('materias_progreso')
            .select('*');
            
        if (error) throw error;

        memoriaMaterias = {};
        if (data) {
            data.forEach(fila => {
                memoriaMaterias[fila.materia_id] = { estado: fila.estado, nota: fila.nota };
            });
        }
        
        aplicarEstilosVisuales();
    } catch (error) {
        console.error("Error al cargar los datos:", error);
    }
}

function aplicarEstilosVisuales() {
    document.querySelectorAll('.materia').forEach(m => {
        m.classList.remove('estado-cursada', 'estado-final');
        const badgeExistente = m.querySelector('.nota-badge');
        if (badgeExistente) badgeExistente.remove();

        const info = memoriaMaterias[m.id];
        if (info) {
            if (info.estado === 'cursada') {
                m.classList.add('estado-cursada');
            } else if (info.estado === 'final') {
                m.classList.add('estado-final');
                if (info.nota !== null && info.nota !== undefined) {
                    const badge = document.createElement('div');
                    badge.className = 'nota-badge';
                    badge.innerText = info.nota;
                    m.appendChild(badge);
                }
            }
        }
    });
}
