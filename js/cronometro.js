// ============================================================
// CRONÔMETRO GLOBAL — VERSÃO SIMPLES E FUNCIONAL
// ============================================================

const INTERVALO_SEGUNDOS = 3600; // 1 HORA
let tempoRestante = INTERVALO_SEGUNDOS;
let intervalId = null;

// ============================================================
// INICIAR CRONÔMETRO
// ============================================================
async function iniciarCronometro() {
    // 1. CARREGAR O TEMPO SALVO NO BANCO
    await carregarTempo();

    // 2. ATUALIZAR A TELA
    atualizarDisplay();

    // 3. INICIAR A CONTAGEM
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }

    intervalId = setInterval(async () => {
        // DIMINUIR 1 SEGUNDO
        tempoRestante--;

        // ATUALIZAR A TELA
        atualizarDisplay();

        // SALVAR NO BANCO A CADA 1 SEGUNDO
        await salvarTempo();

        // SE CHEGOU A ZERO, DISTRIBUIR
        if (tempoRestante <= 0) {
            clearInterval(intervalId);
            intervalId = null;
            await distribuirParaTodos();
        }
    }, 1000);
}

// ============================================================
// CARREGAR TEMPO DO BANCO
// ============================================================
async function carregarTempo() {
    try {
        const { data, error } = await supabaseClient
            .from('cronometro')
            .select('tempo_restante')
            .eq('id', 'global')
            .single();

        if (data && data.tempo_restante !== null) {
            tempoRestante = data.tempo_restante;
            console.log('⏳ Cronômetro carregado:', tempoRestante);
        } else {
            // PRIMEIRA VEZ: CRIAR REGISTRO
            tempoRestante = INTERVALO_SEGUNDOS;
            await supabaseClient
                .from('cronometro')
                .insert({ 
                    id: 'global', 
                    tempo_restante: tempoRestante 
                });
            console.log('🆕 Cronômetro criado!');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar:', error);
        tempoRestante = INTERVALO_SEGUNDOS;
    }
}

// ============================================================
// SALVAR TEMPO NO BANCO
// ============================================================
async function salvarTempo() {
    try {
        await supabaseClient
            .from('cronometro')
            .update({ tempo_restante: tempoRestante })
            .eq('id', 'global');
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
    }
}

// ============================================================
// DISTRIBUIR PARA TODOS OS JOGADORES
// ============================================================
async function distribuirParaTodos() {
    try {
        console.log('🌊 DISTRIBUINDO ONDA!');

        // BUSCAR TODOS OS USUÁRIOS
        const allUsers = await getAllUsers();

        // PARA CADA USUÁRIO, ADICIONAR 1 ESTRELA E 1 TOMATE
        for (const user of allUsers) {
            const estrelas = (user.estrelas_disponiveis || 0) + 1;
            const tomates = (user.tomates_disponiveis || 0) + 1;
            
            await updateUserPoints(user.id, 'estrelas_disponiveis', estrelas);
            await updateUserPoints(user.id, 'tomates_disponiveis', tomates);
        }

        // RESETAR O CRONÔMETRO
        tempoRestante = INTERVALO_SEGUNDOS;
        await salvarTempo();
        atualizarDisplay();

        // NOTIFICAÇÃO
        showToast('🌊 ONDA DE ESTRELAS! Todos ganharam 1⭐ e 1🍅!', '🌊');

        // RECARREGAR PARA ATUALIZAR OS SALDOS
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error('❌ Erro na distribuição:', error);
        tempoRestante = INTERVALO_SEGUNDOS;
        await salvarTempo();
        atualizarDisplay();
    }
}

// ============================================================
// ATUALIZAR DISPLAY
// ============================================================
function atualizarDisplay() {
    const el = document.getElementById('cronometroDisplay');
    if (!el) return;

    const horas = Math.floor(tempoRestante / 3600);
    const minutos = Math.floor((tempoRestante % 3600) / 60);
    const segundos = tempoRestante % 60;

    el.textContent = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}
