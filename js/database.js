// ===== OPERAÇÕES DO BANCO DE DADOS =====

// Buscar dados do usuário
async function getUserData(userId) {
    if (!supabaseClient) {
        throw new Error('Supabase não inicializado. Aguarde o carregamento.');
    }
    const { data, error } = await supabaseClient
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
}

// Buscar todos os usuários
async function getAllUsers() {
    if (!supabaseClient) {
        throw new Error('Supabase não inicializado. Aguarde o carregamento.');
    }
    const { data, error } = await supabaseClient
        .from('usuarios')
        .select('*');

    if (error) throw error;
    return data;
}

// Atualizar saldo de estrelas/tomates
async function updateUserPoints(userId, field, value) {
    if (!supabaseClient) {
        throw new Error('Supabase não inicializado. Aguarde o carregamento.');
    }
    const { error } = await supabaseClient
        .from('usuarios')
        .update({ [field]: value })
        .eq('id', userId);

    if (error) throw error;
}

// Registrar ação no histórico
async function addHistory(action, fromUserId, toUserId, type) {
    if (!supabaseClient) {
        throw new Error('Supabase não inicializado. Aguarde o carregamento.');
    }
    const { error } = await supabaseClient
        .from('historico')
        .insert({
            action: action,
            from_user_id: fromUserId,
            to_user_id: toUserId,
            type: type,
            created_at: new Date().toISOString(),
        });

    if (error) throw error;
}

// Buscar histórico
async function getHistory(limit = 20) {
    if (!supabaseClient) {
        throw new Error('Supabase não inicializado. Aguarde o carregamento.');
    }
    const { data, error } = await supabaseClient
        .from('historico')
        .select('*, from_user:from_user_id(username, avatar_emoji), to_user:to_user_id(username, avatar_emoji)')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}

// Processar ação de dar estrela
async function giveStar(fromUserId, toUserId) {
    const fromUser = await getUserData(fromUserId);
    const toUser = await getUserData(toUserId);

    if (fromUser.estrelas_disponiveis <= 0) {
        throw new Error('Você não tem estrelas disponíveis hoje!');
    }

    await updateUserPoints(fromUserId, 'estrelas_disponiveis', fromUser.estrelas_disponiveis - 1);
    await updateUserPoints(fromUserId, 'estrelas_dadas', fromUser.estrelas_dadas + 1);
    await updateUserPoints(toUserId, 'estrelas_recebidas', toUser.estrelas_recebidas + 1);
    await addHistory(`⭐ deu uma estrela para`, fromUserId, toUserId, 'star');

    return true;
}

// Processar ação de jogar tomate
async function giveTomato(fromUserId, toUserId) {
    const fromUser = await getUserData(fromUserId);
    const toUser = await getUserData(toUserId);

    if (fromUser.tomates_disponiveis <= 0) {
        throw new Error('Você não tem tomates disponíveis hoje!');
    }

    await updateUserPoints(fromUserId, 'tomates_disponiveis', fromUser.tomates_disponiveis - 1);
    await updateUserPoints(fromUserId, 'tomates_dados', fromUser.tomates_dados + 1);
    await updateUserPoints(toUserId, 'tomates_recebidos', toUser.tomates_recebidos + 1);
    await addHistory(`🍅 jogou um tomate em`, fromUserId, toUserId, 'tomato');

    return true;
}

// Sistema diário - adicionar pontos
// Sistema de tempo - adicionar pontos a cada 1 hora
async function dailyUpdate(userId) {
    if (!supabaseClient) {
        throw new Error('Supabase não inicializado. Aguarde o carregamento.');
    }
    const user = await getUserData(userId);
    const lastAccess = new Date(user.ultimo_acesso);
    const now = new Date();
    
    // Calcular diferença em horas (em vez de dias)
    const diffHours = Math.floor((now - lastAccess) / (1000 * 60 * 60));
    
    // Se passou pelo menos 1 hora
    if (diffHours >= 1) {
        // Adiciona 1 estrela e 1 tomate por hora
        const newStars = (user.estrelas_disponiveis || 0) + diffHours;
        const newTomatoes = (user.tomates_disponiveis || 0) + diffHours;

        await updateUserPoints(userId, 'estrelas_disponiveis', newStars);
        await updateUserPoints(userId, 'tomates_disponiveis', newTomatoes);
        await updateUserPoints(userId, 'ultimo_acesso', now.toISOString());

        return { starsAdded: diffHours, tomatoesAdded: diffHours };
    }
    return { starsAdded: 0, tomatoesAdded: 0 };
}
