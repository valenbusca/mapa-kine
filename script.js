let materiaSeleccionada = null;
let estadoTemporal = 'pendiente';

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

    // Botones del panel
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

// Lógica de Correlativas (igual que antes)
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

// --- LOGICA DE GUARDADO Y PANEL ---

function abrirPanel(materiaHTML) {
    materiaSeleccionada = materiaHTML.id;
    document.getElementById('panel-title').innerText = materiaHTML.innerText;
    
    // Leer datos guardados de esta materia
    const datos = JSON.parse(localStorage.getItem('mapaKine')) || {};
    const info = datos[materiaSeleccionada] || { estado: 'pendiente', nota: '' };
    
    estadoTemporal = info.estado;
    
    // Actualizar botones UI
    document.querySelectorAll('.btn-status').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-status') === estadoTemporal);
    });
    
    // Mostrar u ocultar input de nota
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

function guardarMateria() {
    if (!materiaSeleccionada) return;
    
    const inputNota = document.getElementById('grade-input');
    let nota = '';
    if (estadoTemporal === 'final') {
        nota = inputNota.value;
    }

    const datos = JSON.parse(localStorage.getItem('mapaKine')) || {};
    
    // Si la pasa a pendiente, borramos el registro para no ocupar espacio
    if (estadoTemporal === 'pendiente') {
        delete datos[materiaSeleccionada];
    } else {
        datos[materiaSeleccionada] = { estado: estadoTemporal, nota: nota };
    }
    
    localStorage.setItem('mapaKine', JSON.stringify(datos));
    
    // Actualizar visualmente la materia en el mapa
    aplicarEstilosVisuales();
    cerrarPanel();
    resetColors();
}

function cargarDatosGuardados() {
    aplicarEstilosVisuales();
}

function aplicarEstilosVisuales() {
    const datos = JSON.parse(localStorage.getItem('mapaKine')) || {};
    
    document.querySelectorAll('.materia').forEach(m => {
        // Limpiar estados previos
        m.classList.remove('estado-cursada', 'estado-final');
        const badgeExistente = m.querySelector('.nota-badge');
        if (badgeExistente) badgeExistente.remove();

        const info = datos[m.id];
        if (info) {
            if (info.estado === 'cursada') {
                m.classList.add('estado-cursada');
            } else if (info.estado === 'final') {
                m.classList.add('estado-final');
                if (info.nota) {
                    const badge = document.createElement('div');
                    badge.className = 'nota-badge';
                    badge.innerText = info.nota;
                    m.appendChild(badge);
                }
            }
        }
    });
}
