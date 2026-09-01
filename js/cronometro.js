// ============================================================
// SISTEMA DE ONDA DE ESTRELAS — VERSÃO GLOBAL CORRETA
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

    // 1. Carregar o estado do banco (data da última onda)
    await carregarEstadoCronometro();

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
        } else {
            // Parar o intervalo enquanto distribui
            clearInterval(intervalId);
            intervalId = null;
            await distribuirOnda();
        }
    }, 1000);
}

// ============================================================
// CARREGAR ESTADO DO BANCO
// ============================================================
async function carregarEstadoCronometro() {
    try {
        // Buscar a data da última onda
        const { data, error } = await supabaseClient
            .from('sistema')
            .select('ultima_onda')
            .eq('id', 'onda_estrelas')
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Erro ao carregar cronômetro:', error);
            return;
        }

        const agora = new Date();

        if (data && data.ultima_onda) {
            const ultimaData = new Date(data.ultima_onda);
            const diffSegundos = Math.floor((agora - ultimaData) / 1000);
            
            if (diffSegundos < INTERVALO_SEGUNDOS) {
                // Ainda não passou 1 hora
                tempoRestante = INTERVALO_SEGUNDOS - diffSegundos;
                console.log(`⏳ Tempo restante: ${tempoRestante} segundos`);
            } else {
                // Já passou 1 hora, distribui imediatamente
                tempoRestante = 0;
                console.log('⏳ Já passou 1 hora, distribuindo...');
                await distribuirOnda();
            }
        } else {
            // Primeira vez: criar registro com a data atual
            await supabaseClient
                .from('sistema')
                .insert({
                    id: 'onda_estrelas',
                    ultima_onda: agora.toISOString(),
                });
            tempoRestante = INTERVALO_SEGUNDOS;
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

        // Salvar a data da última onda
        const agora = new Date();
        await supabaseClient
            .from('sistema')
            .upsert({
                id: 'onda_estrelas',
                ultima_onda: agora.toISOString(),
            });

        // Resetar o cronômetro
        tempoRestante = INTERVALO_SEGUNDOS;
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
