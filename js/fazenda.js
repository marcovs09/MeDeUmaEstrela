// ===== FAZENDA DE TOMATES =====

// Configurações
const CLIQUES_POR_TOMATE = 150;
const COOLDOWN_MINUTOS = 25;

// Estado
let cliquesHoje = 0;
let tomatesGanhosHoje = 0;
let ultimoTomate = null; // Data do último tomate ganho
let cooldownAtivo = false;

document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth();
    if (!user) return;

    try {
        const userData = await getUserData(user.id);

        // Atualizar navbar
        document.getElementById('navAvatar').textContent = userData.avatar_emoji || '🟡';
        document.getElementById('navUsername').textContent = userData.username;

        // Carregar estado do banco (se existir)
        await carregarEstado(user.id);

        // Criar os pés de tomate
        criarCampo();

        // Atualizar UI
        atualizarUI();

        // Iniciar timer do cooldown
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

    // Animação
    const pe = document.querySelectorAll('.pé-tomate')[index];
    pe.classList.add('clicado');
    setTimeout(() => pe.classList.remove('clicado'), 300);

    // Contar clique
    cliquesHoje++;
    const progresso = Math.min((cliquesHoje / CLIQUES_POR_TOMATE) * 100, 100);
    document.getElementById('progressoBar').style.width = progresso + '%';
    document.getElementById('progressoText').textContent = `${cliquesHoje}/${CLIQUES_POR_TOMATE}`;

    // Verificar se ganhou tomate
    if (cliquesHoje >= CLIQUES_POR_TOMATE) {
        ganharTomate();
    }

    // Salvar progresso no banco
    salvarProgresso();
}

// ===== GANHAR TOMATE =====
async function ganharTomate() {
    const user = getCurrentUser();
    if (!user) return;

    // Resetar cliques
    cliquesHoje = 0;
    tomatesGanhosHoje++;
    ultimoTomate = new Date();
    cooldownAtivo = true;

    // Atualizar UI
    document.getElementById('tomatesGanhosHoje').textContent = tomatesGanhosHoje;
    document.getElementById('progressoBar').style.width = '0%';
    document.getElementById('progressoText').textContent = `0/${CLIQUES_POR_TOMATE}`;

    // Mostrar mensagem
    const msg = document.getElementById('tomateGanho');
    msg.style.display = 'block';
    setTimeout(() => { msg.style.display = 'none'; }, 4000);

    // Adicionar tomate ao saldo do usuário
    try {
        const userData = await getUserData(user.id);
        const novosTomates = (userData.tomates_disponiveis || 0) + 1;
        await updateUserPoints(user.id, 'tomates_disponiveis', novosTomates);
        
        showToast(`🍅 Você ganhou um tomate! Saldo: ${novosTomates} tomates!`, '🍅');
    } catch (error) {
        console.error('Erro ao adicionar tomate:', error);
    }

    // Salvar estado
    await salvarEstado(user.id);

    // Iniciar cooldown
    iniciarTimer();
}

// ===== COOLDOWN =====
function iniciarTimer() {
    if (!ultimoTomate) return;

    const agora = new Date();
    const diffMs = agora - new Date(ultimoTomate);
    const diffMin = diffMs / (1000 * 60);

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

    // Atualizar a cada segundo
    setTimeout(iniciarTimer, 1000);
}

// ===== SALVAR NO BANCO =====
async function salvarEstado(userId) {
    try {
        // Salvar progresso em uma nova tabela ou coluna
        // Opção: usar a tabela 'usuarios' com colunas extras
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
        }
    } catch (error) {
        console.error('Erro ao carregar estado:', error);
    }
}

function salvarProgresso() {
    // Salvar a cada clique (opcional, para não perder progresso)
    const user = getCurrentUser();
    if (user) {
        // Podemos salvar a cada 10 cliques para não sobrecarregar
        if (cliquesHoje % 10 === 0) {
            salvarEstado(user.id);
        }
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
        const diffMs = agora - new Date(ultimoTomate);
        const diffMin = diffMs / (1000 * 60);
        if (diffMin >= COOLDOWN_MINUTOS) {
            cooldownAtivo = false;
            document.getElementById('tempoRestante').textContent = '✅ Disponível!';
        }
    }
}
