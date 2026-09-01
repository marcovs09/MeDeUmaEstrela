// ============================================================
// SISTEMA DE ONDA DE ESTRELAS — VERSÃO CORRETA E ESTÁVEL
// ============================================================

const INTERVALO_SEGUNDOS = 3600; // 1 HORA = 3600 segundos
let tempoRestante = INTERVALO_SEGUNDOS;
let cronometroAtivo = false;
let intervalId = null;

// ============================================================
// INICIAR CRONÔMETRO
// ============================================================
async function iniciarCronometro() {
    if (cronometroAtivo) return;
    cronometroAtivo = true;

    await carregarEstadoCronometro();
    atualizarDisplayCronometro();

    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }

    intervalId = setInterval(async () => {
        if (tempoRestante > 0) {
            tempoRestante--;
            atualizarDisplayCronometro();
        } else {
            clearInterval(intervalId);
            intervalId = null;
            await distribuirOnda();
        }
    }, 1000);
}

// ============================================================
// CARREGAR ESTADO SALVO
// ============================================================
async function carregarEstadoCronometro() {
    try {
        const { data, error } = await supabaseClient
            .from('sistema')
            .select('ultima_onda')
            .eq('id', 'onda_estrelas')
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Erro ao carregar cronômetro:', error);
            return;
        }

        if (data && data.ultima_onda) {
            const ultimaData = new Date(data.ultima_onda);
            const agora = new Date();
            const diffSegundos = Math.floor((agora - ultimaData) / 1000);
            
            if (diffSegundos < INTERVALO_SEGUNDOS) {
                tempoRestante = INTERVALO_SEGUNDOS - diffSegundos;
            } else {
                tempoRestante = 0;
                await distribuirOnda();
            }
        } else {
            const agora = new Date();
            await supabaseClient
                .from('sistema')
                .insert({
                    id: 'onda_estrelas',
                    ultima_onda: agora.toISOString(),
                });
            tempoRestante = INTERVALO_SEGUNDOS;
        }
    } catch (error) {
        console.error('Erro ao carregar estado:', error);
        tempoRestante = INTERVALO_SEGUNDOS;
    }
}

// ============================================================
// DISTRIBUIR ONDA PARA TODOS
// ============================================================
async function distribuirOnda() {
    try {
        console.log('🌊 DISTRIBUINDO ONDA DE ESTRELAS E TOMATES!');

        const allUsers = await getAllUsers();

        for (const user of allUsers) {
            const estrelasAtuais = user.estrelas_disponiveis || 0;
            const tomatesAtuais = user.tomates_disponiveis || 0;
            
            await updateUserPoints(user.id, 'estrelas_disponiveis', estrelasAtuais + 1);
            await updateUserPoints(user.id, 'tomates_disponiveis', tomatesAtuais + 1);
        }

        const agora = new Date();
        await supabaseClient
            .from('sistema')
            .upsert({
                id: 'onda_estrelas',
                ultima_onda: agora.toISOString(),
            });

        tempoRestante = INTERVALO_SEGUNDOS;
        atualizarDisplayCronometro();

        showToast('🌊 ONDA DE ESTRELAS! Todos ganharam 1⭐ e 1🍅!', '🌊');

        setTimeout(() => {
            window.location.reload();
        }, 3000);

    } catch (error) {
        console.error('❌ Erro ao distribuir onda:', error);
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
