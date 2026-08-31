// ============================================================
// FAZENDA DE TOMATES — VERSÃO ESTÁVEL
// ============================================================

const CLIQUES_POR_TOMATE = 150;
const COOLDOWN_MINUTOS = 25;

let cliquesHoje = 0;
let tomatesGanhosHoje = 0;
let ultimoTomate = null; // sempre guardado como string ISO
let userId = null;
let timerInterval = null;

// ============================================================
// INICIALIZAÇÃO
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
        console.error('Erro ao carregar fazenda:', error);
        showToast('Erro ao carregar dados da fazenda.', '❌');
    }
});

// ============================================================
// CRIAR CAMPO
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
// CLICAR NO PÉ
// ============================================================
function clicarPe(index) {
    if (cooldownAtivo()) {
        showToast('⏳ Aguarde o cooldown de 25 minutos!', '⏳');
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
// GANHAR TOMATE
// ============================================================
async function ganharTomate() {
    if (!userId) return;

    cliquesHoje = 0;
    tomatesGanhosHoje++;
    ultimoTomate = new Date().toISOString(); // 👈 salva como string ISO

    // Atualiza UI
    document.getElementById('tomatesGanhosHoje').textContent = tomatesGanhosHoje;
    document.getElementById('progressoBar').style.width = '0%';
    document.getElementById('progressoText').textContent = `0/${CLIQUES_POR_TOMATE}`;

    // Mensagem comemoração
    const msg = document.getElementById('tomateGanho');
    msg.style.display = 'block';
    setTimeout(() => { msg.style.display = 'none'; }, 4000);

    // Adiciona tomate ao saldo do usuário
    try {
        const userData = await getUserData(userId);
        const novosTomates = (userData.tomates_disponiveis || 0) + 1;
        await updateUserPoints(userId, 'tomates_disponiveis', novosTomates);
        showToast(`🍅 Você ganhou um tomate! Saldo: ${novosTomates}`, '🍅');
    } catch (error) {
        console.error('Erro ao adicionar tomate:', error);
    }

    await salvarEstado();
    iniciarTimer();
}

// ============================================================
// COOLDOWN — CÁLCULO CORRETO
// ============================================================
function cooldownAtivo() {
    if (!ultimoTomate) return false;

    const agora = new Date();
    const ultimo = new Date(ultimoTomate);
    if (isNaN(ultimo.getTime())) return false; // data inválida

    const diffMs = agora - ultimo;
    const diffMin = diffMs / (1000 * 60);

    return diffMin < COOLDOWN_MINUTOS;
}

function tempoRestanteSegundos() {
    if (!ultimoTomate) return 0;

    const agora = new Date();
    const ultimo = new Date(ultimoTomate);
    if (isNaN(ultimo.getTime())) return 0;

    const diffMs = agora - ultimo;
    const restanteMs = (COOLDOWN_MINUTOS * 60 * 1000) - diffMs;
    return Math.max(0, Math.floor(restanteMs / 1000));
}

// ============================================================
// TIMER — ATUALIZA A CADA 1 SEGUNDO
// ============================================================
function iniciarTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    atualizarDisplayTimer();

    timerInterval = setInterval(() => {
        atualizarDisplayTimer();
    }, 1000);
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
// SALVAR E CARREGAR DO BANCO
// ============================================================
async function salvarEstado() {
    if (!userId) return;
    try {
        await updateUserPoints(userId, 'cliques_tomate', cliquesHoje);
        await updateUserPoints(userId, 'tomates_fazenda', tomatesGanhosHoje);
        if (ultimoTomate) {
            await updateUserPoints(userId, 'ultimo_tomate', ultimoTomate);
        } else {
            await updateUserPoints(userId, 'ultimo_tomate', null);
        }
    } catch (error) {
        console.error('Erro ao salvar estado:', error);
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
                ultimoTomate = raw; // mantém como string ISO
            } else {
                ultimoTomate = null;
                await updateUserPoints(userId, 'ultimo_tomate', null);
            }
        } else {
            ultimoTomate = null;
        }

    } catch (error) {
        console.error('Erro ao carregar estado:', error);
    }
}

// ============================================================
// UI — ATUALIZA TELA
// ============================================================
function atualizarUI() {
    document.getElementById('tomatesGanhosHoje').textContent = tomatesGanhosHoje;
    const progresso = Math.min((cliquesHoje / CLIQUES_POR_TOMATE) * 100, 100);
    document.getElementById('progressoBar').style.width = progresso + '%';
    document.getElementById('progressoText').textContent = `${cliquesHoje}/${CLIQUES_POR_TOMATE}`;
}

// ============================================================
// BOTÕES
// ============================================================
function configurarBotoes() {
    document.getElementById('btnReset')?.addEventListener('click', resetarMinigame);
}

async function resetarMinigame() {
    if (!userId) return;
    const confirmar = confirm('⚠️ Resetar progresso da fazenda? Você vai perder todos os cliques acumulados.');
    if (!confirmar) return;

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

        showToast('🔄 Minigame resetado!', '🔄');

    } catch (error) {
        console.error('Erro ao resetar:', error);
        alert('Erro ao resetar o minigame.');
    }
}
