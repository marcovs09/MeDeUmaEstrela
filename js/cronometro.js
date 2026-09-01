// ============================================================
// SISTEMA DE ONDA DE ESTRELAS — VERSÃO GLOBAL E PERSISTENTE
// ============================================================

const INTERVALO_SEGUNDOS = 3600; // 1 HORA
let tempoRestante = INTERVALO_SEGUNDOS;
let cronometroAtivo = false;
let intervalId = null;

// ============================================================
// INICIAR CRONÔMETRO
// ============================================================
async function iniciarCronometro() {
    if (cronometroAtivo) return;
    cronometroAtivo = true;

    // 1. Carregar o tempo restante salvo
    await carregarTempoRestante();

    // 2. Atualizar display
    atualizarDisplayCronometro();

    // 3. Iniciar contagem regressiva
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }

    intervalId = setInterval(async () => {
        if (tempoRestante > 0) {
            tempoRestante--;
            atualizarDisplayCronometro();
            
            // Salvar o tempo restante a cada 5 segundos (para não sobrecarregar)
            if (tempoRestante % 5 === 0) {
                await salvarTempoRestante();
            }
        } else {
            // Parar o intervalo enquanto distribui
            clearInterval(intervalId);
            intervalId = null;
            await distribuirOnda();
        }
    }, 1000);
}

// ============================================================
// SALVAR TEMPO RESTANTE NO BANCO
// ============================================================
async function salvarTempoRestante() {
    try {
        await supabaseClient
            .from('sistema')
            .upsert({
                id: 'onda_estrelas',
                tempo_restante: tempoRestante,
                ultima_atualizacao: new Date().toISOString(),
            });
    } catch (error) {
        console.error('Erro ao salvar tempo restante:', error);
    }
}

// ============================================================
// CARREGAR TEMPO RESTANTE DO BANCO
// ============================================================
async function carregarTempoRestante() {
    try {
        const { data, error } = await supabaseClient
            .from('sistema')
            .select('tempo_restante, ultima_atualizacao')
            .eq('id', 'onda_estrelas')
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Erro ao carregar cronômetro:', error);
            return;
        }

        if (data && data.tempo_restante !== undefined && data.tempo_restante !== null) {
            // Verificar se o tempo salvo ainda é válido
            const ultimaAtualizacao = new Date(data.ultima_atualizacao);
            const agora = new Date();
            const diffSegundos = Math.floor((agora - ultimaAtualizacao) / 1000);
            
            // Subtrair o tempo que passou desde a última atualização
            tempoRestante = Math.max(0, data.tempo_restante - diffSegundos);
            
            console.log(`⏳ Tempo restante carregado: ${tempoRestante} segundos`);
        } else {
            // Primeira vez: criar registro
            tempoRestante = INTERVALO_SEGUNDOS;
            await salvarTempoRestante();
            console.log('🆕 Cronômetro iniciado!');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar estado:', error);
        tempoRestante = INTERVALO_SEGUNDOS;
    }
}

// ============================================================
// DISTRIBUIR ONDA PARA TODOS
// ============================================================
async function distribuirOnda() {
    try {
        console.log('🌊 INICIANDO DISTRIBUIÇÃO DA ONDA!');

        // Buscar todos os usuários
        const allUsers = await getAllUsers();
        console.log(`👥 ${allUsers.length} usuários encontrados`);

        // Para cada usuário, adicionar EXATAMENTE 1 estrela e 1 tomate
        for (const user of allUsers) {
            const estrelasAtuais = user.estrelas_disponiveis || 0;
            const tomatesAtuais = user.tomates_disponiveis || 0;
            
            await updateUserPoints(user.id, 'estrelas_disponiveis', estrelasAtuais + 1);
            await updateUserPoints(user.id, 'tomates_disponiveis', tomatesAtuais + 1);
            
            console.log(`✅ ${user.username}: +1⭐ +1🍅 (agora: ${estrelasAtuais + 1}⭐ ${tomatesAtuais + 1}🍅)`);
        }

        // Resetar o cronômetro
        tempoRestante = INTERVALO_SEGUNDOS;
        await salvarTempoRestante();
        atualizarDisplayCronometro();

        // Mostrar notificação
        showToast('🌊 ONDA DE ESTRELAS! Todos ganharam 1⭐ e 1🍅!', '🌊');

        // Recarregar a página para atualizar os saldos
        setTimeout(() => {
            window.location.reload();
        }, 3000);

    } catch (error) {
        console.error('❌ Erro ao distribuir onda:', error);
        // Resetar cronômetro mesmo com erro
        tempoRestante = INTERVALO_SEGUNDOS;
        await salvarTempoRestante();
        atualizarDisplayCronometro();
    }
}

// ============================================================
// ATUALIZAR DISPLAY
// ============================================================
function atualizarDisplayCronometro() {
    const el = document.getElementById('cronometroDisplay');
    if (!el) return;

    const horas = Math.floor(tempoRestante / 3600);
    const minutos = Math.floor((tempoRestante % 3600) / 60);
    const segundos = tempoRestante % 60;

    el.textContent = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}
