// ============================================================
// CRONÔMETRO GLOBAL — FRONTEND (SÓ MOSTRA O TEMPO)
// ============================================================

let tempoRestante = 3600;
let intervalId = null;

// ============================================================
// BUSCAR O TEMPO DO SERVIDOR
// ============================================================
async function buscarTempoServidor() {
    try {
        // 1. Buscar a próxima recompensa no banco
        const { data, error } = await supabaseClient
            .from('sistema')
            .select('next_global_reward_at')
            .eq('id', 'cronometro_global')
            .single();

        if (error) {
            console.error('❌ Erro ao buscar tempo:', error);
            return 3600;
        }

        if (!data || !data.next_global_reward_at) {
            console.warn('⚠️ Nenhuma data encontrada, usando 1 hora padrão');
            return 3600;
        }

        // 2. Calcular o tempo restante
        const agora = new Date();
        const nextReward = new Date(data.next_global_reward_at);
        const diffSegundos = Math.floor((nextReward - agora) / 1000);

        // 3. Se já passou, buscar novamente (pode ter atualizado)
        if (diffSegundos <= 0) {
            console.log('⏳ Já passou da hora, buscando novamente...');
            // Recarregar os dados
            await buscarTempoServidor();
            return 0;
        }

        console.log(`⏳ Tempo restante: ${diffSegundos} segundos (${Math.floor(diffSegundos/60)} minutos)`);
        return diffSegundos;

    } catch (error) {
        console.error('❌ Erro ao buscar tempo do servidor:', error);
        return 3600;
    }
}

// ============================================================
// INICIAR CRONÔMETRO
// ============================================================
async function iniciarCronometro() {
    console.log('⏳ Iniciando cronômetro global...');

    // 1. Buscar o tempo do servidor
    tempoRestante = await buscarTempoServidor();

    // 2. Atualizar a tela
    atualizarDisplay();

    // 3. Se o tempo for 0, buscar novamente (pode ter atualizado)
    if (tempoRestante <= 0) {
        setTimeout(async () => {
            tempoRestante = await buscarTempoServidor();
            atualizarDisplay();
        }, 2000);
        return;
    }

    // 4. Iniciar contagem regressiva (SÓ VISUAL)
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }

    intervalId = setInterval(() => {
        if (tempoRestante > 0) {
            tempoRestante--;
            atualizarDisplay();
        } else {
            // Se chegou a zero, buscar novamente do servidor
            clearInterval(intervalId);
            intervalId = null;
            buscarTempoServidor().then(novoTempo => {
                tempoRestante = novoTempo;
                atualizarDisplay();
                iniciarCronometro(); // Reiniciar o loop
            });
        }
    }, 1000);
}

// ============================================================
// ATUALIZAR DISPLAY
// ============================================================
function atualizarDisplay() {
    const el = document.getElementById('cronometroDisplay');
    if (!el) {
        console.warn('⚠️ Elemento cronometroDisplay não encontrado');
        return;
    }

    // Se o tempo for inválido, mostrar 01:00:00
    if (tempoRestante < 0 || isNaN(tempoRestante)) {
        tempoRestante = 3600;
    }

    const horas = Math.floor(tempoRestante / 3600);
    const minutos = Math.floor((tempoRestante % 3600) / 60);
    const segundos = tempoRestante % 60;

    el.textContent = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

// ============================================================
// FUNÇÃO PARA ATUALIZAR O SALDO (CHAMADA PELO MAIN.JS)
// ============================================================
async function atualizarSaldoUI() {
    try {
        const user = getCurrentUser();
        if (!user) return;

        const userData = await getUserData(user.id);
        if (!userData) return;

        // Atualizar os elementos da interface
        const starEl = document.getElementById('starCount');
        const tomatoEl = document.getElementById('tomatoCount');

        if (starEl) {
            starEl.textContent = `${userData.estrelas_disponiveis || 0} disponível`;
        }
        if (tomatoEl) {
            tomatoEl.textContent = `${userData.tomates_disponiveis || 0} disponível`;
        }

        console.log('✅ Saldo atualizado:', userData.estrelas_disponiveis, '⭐', userData.tomates_disponiveis, '🍅');
    } catch (error) {
        console.error('❌ Erro ao atualizar saldo:', error);
    }
}
