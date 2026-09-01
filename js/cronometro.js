// ============================================================
// SISTEMA DE ONDA DE ESTRELAS — CRONÔMETRO GLOBAL
// ============================================================

const INTERVALO_MINUTOS = 1; // 1 hora (mude para 60 depois)
let tempoRestante = INTERVALO_MINUTOS * 60;
let cronometroAtivo = false;
let userId = null;

// ============================================================
// INICIALIZAR CRONÔMETRO
// ============================================================
async function iniciarCronometro() {
    if (cronometroAtivo) return;
    cronometroAtivo = true;

    const user = getCurrentUser();
    if (user) userId = user.id;

    await carregarEstadoCronometro();
    atualizarDisplayCronometro();

    setInterval(async () => {
        if (tempoRestante > 0) {
            tempoRestante--;
            atualizarDisplayCronometro();
        } else {
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
            .select('*')
            .eq('id', 'onda_estrelas')
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Erro ao carregar cronômetro:', error);
            return;
        }

        if (data) {
            const ultimaData = new Date(data.ultima_onda);
            const agora = new Date();
            const diffSegundos = Math.floor((agora - ultimaData) / 1000);
            
            if (diffSegundos < INTERVALO_MINUTOS * 60) {
                tempoRestante = (INTERVALO_MINUTOS * 60) - diffSegundos;
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
            tempoRestante = INTERVALO_MINUTOS * 60;
        }
    } catch (error) {
        console.error('Erro ao carregar estado do cronômetro:', error);
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
            const novasEstrelas = (user.estrelas_disponiveis || 0) + 1;
            const novosTomates = (user.tomates_disponiveis || 0) + 1;
            
            await updateUserPoints(user.id, 'estrelas_disponiveis', novasEstrelas);
            await updateUserPoints(user.id, 'tomates_disponiveis', novosTomates);
        }

        const agora = new Date();
        await supabaseClient
            .from('sistema')
            .upsert({
                id: 'onda_estrelas',
                ultima_onda: agora.toISOString(),
            });

        tempoRestante = INTERVALO_MINUTOS * 60;
        atualizarDisplayCronometro();

        showToast('🌊 ONDA DE ESTRELAS! Todos ganharam 1⭐ e 1🍅!', '🌊');

        if (typeof atualizarSaldoUI === 'function') {
            await atualizarSaldoUI();
        }

        // Recarregar a página para atualizar os saldos
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error('Erro ao distribuir onda:', error);
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
