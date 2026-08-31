// ============================================================
// FAZENDA DE TOMATES — VERSÃO 2.0 (20 MIN / 200 CLIQUES)
// ============================================================

const CLIQUES_POR_TOMATE = 200;
const COOLDOWN_MINUTOS = 20;

let cliquesHoje = 0;
let tomatesGanhosHoje = 0;
let ultimoTomate = null;
let userId = null;
let timerInterval = null;

// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth();
    if (!user) return;
    userId = user.id;

    try {
        const userData = await getUserData(userId);
        document.getElementById('navAvatar').textContent = userData.avatar_emoji || '🟡';
        document.getElementById('navUsername').textContent = userData.username;

        await carregarEstado(userId);
        criarCampo();
        atualizarUI();
        iniciarTimer();
        configurarBotoes();

    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao carregar fazenda.', '❌');
    }
});

// ============================================================
function criarCampo() {
    const campo = document.getElementById('campo');
    const emojis = ['🌱', '🌿', '☘️', '🍀', '🌱'];
    campo.innerHTML = '';
    for (let i = 0; i < 30; i++) {
        const pe = document.createElement('div');
        pe.className = 'pé-tomate';
        pe.dataset.index = i;
        pe.innerHTML = `<span class="planta">${emojis[i % emojis.length]}</span>`;
        pe.addEventListener('click', () => clicarPe(i));
        campo.appendChild(pe);
    }
}

// ============================================================
function clicarPe(index) {
    if (cooldownAtivo()) {
        showToast('⏳ Aguarde 20 minutos!', '⏳');
        return;
    }

    const pe = document.querySelectorAll('.pé-tomate')[index];
    pe.classList.add('clicado');
    setTimeout(() => pe.classList.remove('clicado'), 300);

    cliquesHoje++;
    const progresso = Math.min((cliquesHoje / CLIQUES_POR_TOMATE) * 100, 100);
    document.getElementById('progressoBar').style.width = progresso + '%';
    document.getElementById('progressoText').textContent = `${cliquesHoje}/${CLIQUES_POR_TOMATE}`;

    if (cliquesHoje >= CLIQUES_POR_TOMATE) {
        ganharTomate();
    }

    salvarEstado();
}

// ============================================================
async function ganharTomate() {
    if (!userId) return;

    cliquesHoje = 0;
    tomatesGanhosHoje++;
    ultimoTomate = new Date().toISOString();

    document.getElementById('tomatesGanhosHoje').textContent = tomatesGanhosHoje;
    document.getElementById('progressoBar').style.width = '0%';
    document.getElementById('progressoText').textContent = `0/${CLIQUES_POR_TOMATE}`;

    const msg = document.getElementById('tomateGanho');
    msg.style.display = 'block';
    setTimeout(() => { msg.style.display = 'none'; }, 4000);

    try {
        const userData = await getUserData(userId);
        const novosTomates = (userData.tomates_disponiveis || 0) + 1;
        await updateUserPoints(userId, 'tomates_disponiveis', novosTomates);
        showToast(`🍅 +1 tomate! Saldo: ${novosTomates}`, '🍅');
    } catch (error) {
        console.error('Erro ao adicionar tomate:', error);
    }

    await salvarEstado();
    iniciarTimer();
}

// ============================================================
function cooldownAtivo() {
    if (!ultimoTomate) return false;
    const agora = new Date();
    const ultimo = new Date(ultimoTomate);
    if (isNaN(ultimo.getTime())) return false;
    const diffMin = (agora - ultimo) / (1000 * 60);
    return diffMin < COOLDOWN_MINUTOS;
}

function tempoRestanteSegundos() {
    if (!ultimoTomate) return 0;
    const agora = new Date();
    const ultimo = new Date(ultimoTomate);
    if (isNaN(ultimo.getTime())) return 0;
    const restanteMs = (COOLDOWN_MINUTOS * 60 * 1000) - (agora - ultimo);
    return Math.max(0, Math.floor(restanteMs / 1000));
}

// ============================================================
function iniciarTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    atualizarDisplayTimer();
    timerInterval = setInterval(atualizarDisplayTimer, 1000);
}

function atualizarDisplayTimer() {
    const el = document.getElementById('tempoRestante');
    if (!el) return;
    if (!ultimoTomate) {
        el.textContent = '✅ Disponível!';
        return;
    }
    const segundos = tempoRestanteSegundos();
    if (segundos <= 0) {
        el.textContent = '✅ Disponível!';
        return;
    }
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    el.textContent = `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
}

// ============================================================
async function salvarEstado() {
    if (!userId) return;
    try {
        await updateUserPoints(userId, 'cliques_tomate', cliquesHoje);
        await updateUserPoints(userId, 'tomates_fazenda', tomatesGanhosHoje);
        await updateUserPoints(userId, 'ultimo_tomate', ultimoTomate);
    } catch (error) {
        console.error('Erro ao salvar:', error);
    }
}

async function carregarEstado(userId) {
    try {
        const userData = await getUserData(userId);
        cliquesHoje = userData.cliques_tomate || 0;
        tomatesGanhosHoje = userData.tomates_fazenda || 0;

        const raw = userData.ultimo_tomate;
        if (raw) {
            const d = new Date(raw);
            if (!isNaN(d.getTime())) {
                ultimoTomate = raw;
            } else {
                ultimoTomate = null;
                await updateUserPoints(userId, 'ultimo_tomate', null);
            }
        } else {
            ultimoTomate = null;
        }

        if (!ultimoTomate || !cooldownAtivo()) {
            ultimoTomate = null;
            await updateUserPoints(userId, 'ultimo_tomate', null);
        }

        atualizarUI();
    } catch (error) {
        console.error('Erro ao carregar:', error);
    }
}

// ============================================================
function atualizarUI() {
    document.getElementById('tomatesGanhosHoje').textContent = tomatesGanhosHoje;
    const progresso = Math.min((cliquesHoje / CLIQUES_POR_TOMATE) * 100, 100);
    document.getElementById('progressoBar').style.width = progresso + '%';
    document.getElementById('progressoText').textContent = `${cliquesHoje}/${CLIQUES_POR_TOMATE}`;
}

// ============================================================
function configurarBotoes() {
    document.getElementById('btnReset').addEventListener('click', resetarMinigame);
}

async function resetarMinigame() {
    if (!userId) return;
    if (!confirm('⚠️ Resetar fazenda? Você vai perder todos os cliques.')) return;

    try {
        cliquesHoje = 0;
        tomatesGanhosHoje = 0;
        ultimoTomate = null;

        await updateUserPoints(userId, 'cliques_tomate', 0);
        await updateUserPoints(userId, 'tomates_fazenda', 0);
        await updateUserPoints(userId, 'ultimo_tomate', null);

        atualizarUI();
        document.getElementById('tempoRestante').textContent = '✅ Disponível!';
        document.getElementById('tomatesGanhosHoje').textContent = '0';
        document.getElementById('progressoBar').style.width = '0%';
        document.getElementById('progressoText').textContent = `0/${CLIQUES_POR_TOMATE}`;

        showToast('🔄 Fazenda resetada!', '🔄');
    } catch (error) {
        console.error('Erro ao resetar:', error);
        alert('Erro ao resetar.');
    }
}
