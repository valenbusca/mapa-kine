document.querySelectorAll('.materia').forEach(materia => {
    const activar = (e) => {
        e.stopPropagation();
        resetColors();
        materia.classList.add('selected');
        procesarCadena(materia.id, 'data-correlativas', 'previa');
        procesarCadena(materia.id, 'data-abre', 'siguiente');
    };

    materia.addEventListener('mouseenter', activar);
    materia.addEventListener('click', activar);
});

document.addEventListener('click', () => resetColors());

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
