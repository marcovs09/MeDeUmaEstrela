// ===== FAZENDA DE TOMATES =====

// Configurações
const CLIQUES_POR_TOMATE = 150;
const COOLDOWN_MINUTOS = 25;

// Estado
let cliquesHoje = 0;
let tomatesGanhosHoje = 0;
let ultimoTomate = null;
let cooldownAtivo = false;
let userId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth();
    if (!user) return;
    userId = user.id;

    try {
        const userData = await getUserData(user.id);

        document.getElementById('navAvatar').textContent = userData.avatar_emoji || '🟡';
        document.getElementById('navUsername').textContent = userData.username;

        await carregarEstado(user.id);
        criarCampo();
        atualizarUI();
        
        // Botão de reset
        document.getElementById('btnReset')?.addEventListener('click', resetarMinigame);
        
        iniciarTimer();

    } catch (error) {
        console.error('Erro ao carregar fazenda:', error);
    }
});

// ===== CRIAR CAMPO =====
function criarCampo() {
    const campo = document.getElementById('campo');
    const emojis = ['🌱', '🌿', '☘️', '🍀', '🌱'];
    
    for (let i = 0; i < 30; i++) {
        const pe = document.createElement('div');
        pe.className = 'pé-tomate';
        pe.dataset.index = i;
        pe.innerHTML = `<span class="planta">${emojis[i % emojis.length]}</span>`;
        pe.addEventListener('click', () => clicarPe(i));
        campo.appendChild(pe);
    }
}

// ===== CLICAR NO PÉ =====
function clicarPe(index) {
    if (cooldownAtivo) {
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

    salvarProgresso();
}

// ===== GANHAR TOMATE =====
async function ganharTomate() {
    if (!userId) return;

    cliquesHoje = 0;
    tomatesGanhosHoje++;
    ultimoTomate = new Date();
    cooldownAtivo = true;

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
        
        showToast(`🍅 Você ganhou um tomate! Saldo: ${novosTomates} tomates!`, '🍅');
    } catch (error) {
        console.error('Erro ao adicionar tomate:', error);
    }

    await salvarEstado();
    iniciarTimer();
}

// ===== COOLDOWN CORRIGIDO =====
function iniciarTimer() {
    if (!ultimoTomate) {
        document.getElementById('tempoRestante').textContent = '✅ Disponível!';
        cooldownAtivo = false;
        return;
    }

    const agora = new Date();
    const ultimo = new Date(ultimoTomate);
    const diffMs = agora - ultimo;
    const diffMin = diffMs / (1000 * 60);

    // Se já passou o cooldown
    if (diffMin >= COOLDOWN_MINUTOS) {
        cooldownAtivo = false;
        document.getElementById('tempoRestante').textContent = '✅ Disponível!';
        return;
    }

    cooldownAtivo = true;
    const restanteMs = (COOLDOWN_MINUTOS * 60 * 1000) - diffMs;
    const restanteMin = Math.floor(restanteMs / (1000 * 60));
    const restanteSeg = Math.floor((restanteMs % (1000 * 60)) / 1000);

    document.getElementById('tempoRestante').textContent = 
        `${String(restanteMin).padStart(2, '0')}:${String(restanteSeg).padStart(2, '0')}`;

    setTimeout(iniciarTimer, 1000);
}

// ===== SALVAR NO BANCO =====
async function salvarEstado() {
    if (!userId) return;
    try {
        await updateUserPoints(userId, 'cliques_tomate', cliquesHoje);
        await updateUserPoints(userId, 'tomates_fazenda', tomatesGanhosHoje);
        if (ultimoTomate) {
            await updateUserPoints(userId, 'ultimo_tomate', ultimoTomate.toISOString());
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
        if (userData.ultimo_tomate) {
            ultimoTomate = new Date(userData.ultimo_tomate);
            // Verificar se a data é válida
            if (isNaN(ultimoTomate.getTime())) {
                ultimoTomate = null;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar estado:', error);
    }
}

function salvarProgresso() {
    if (userId && cliquesHoje % 10 === 0) {
        salvarEstado();
    }
}

// ===== RESETAR MINIGAME =====
async function resetarMinigame() {
    if (!userId) return;

    const confirmar = confirm('⚠️ Tem certeza que quer resetar seu progresso na fazenda? Você vai perder todos os cliques acumulados!');
    if (!confirmar) return;

    try {
        // Resetar estado local
        cliquesHoje = 0;
        tomatesGanhosHoje = 0;
        ultimoTomate = null;
        cooldownAtivo = false;

        // Resetar no banco
        await updateUserPoints(userId, 'cliques_tomate', 0);
        await updateUserPoints(userId, 'tomates_fazenda', 0);
        await updateUserPoints(userId, 'ultimo_tomate', null);

        // Atualizar UI
        atualizarUI();
        document.getElementById('tempoRestante').textContent = '✅ Disponível!';
        document.getElementById('progressoBar').style.width = '0%';
        document.getElementById('progressoText').textContent = `0/${CLIQUES_POR_TOMATE}`;
        document.getElementById('tomatesGanhosHoje').textContent = '0';

        showToast('🔄 Minigame resetado com sucesso!', '🔄');

    } catch (error) {
        console.error('Erro ao resetar:', error);
        alert('Erro ao resetar o minigame.');
    }
}

// ===== ATUALIZAR UI =====
function atualizarUI() {
    document.getElementById('tomatesGanhosHoje').textContent = tomatesGanhosHoje;
    const progresso = Math.min((cliquesHoje / CLIQUES_POR_TOMATE) * 100, 100);
    document.getElementById('progressoBar').style.width = progresso + '%';
    document.getElementById('progressoText').textContent = `${cliquesHoje}/${CLIQUES_POR_TOMATE}`;

    if (ultimoTomate) {
        const agora = new Date();
        const ultimo = new Date(ultimoTomate);
        const diffMin = (agora - ultimo) / (1000 * 60);
        if (diffMin >= COOLDOWN_MINUTOS) {
            cooldownAtivo = false;
            document.getElementById('tempoRestante').textContent = '✅ Disponível!';
        }
    } else {
        document.getElementById('tempoRestante').textContent = '✅ Disponível!';
        cooldownAtivo = false;
    }
}
