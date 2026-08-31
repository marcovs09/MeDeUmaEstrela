document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth();
    if (!user) return;

    try {
        const userData = await getUserData(user.id);

        // Atualizar navbar
        document.getElementById('navAvatar').textContent = userData.avatar_emoji || '🟡';
        document.getElementById('navUsername').textContent = userData.username;

        // Atualizar perfil
        document.getElementById('profileAvatar').textContent = userData.avatar_emoji || '🟡';
        document.getElementById('profileName').textContent = userData.username;

        const stars = userData.estrelas_recebidas || 0;
        const tomatoes = userData.tomates_recebidos || 0;
        const reputation = stars - tomatoes;

        document.getElementById('starsReceived').textContent = stars;
        document.getElementById('tomatoesReceived').textContent = tomatoes;
        document.getElementById('reputation').textContent = reputation >= 0 ? `+${reputation}` : `${reputation}`;
        document.getElementById('starsGiven').textContent = userData.estrelas_dadas || 0;
        document.getElementById('tomatoesGiven').textContent = userData.tomates_dados || 0;

        // Calcular posição no ranking
        const allUsers = await getAllUsers();
        const sorted = allUsers.sort((a, b) =>
            (b.estrelas_recebidas || 0) - (a.estrelas_recebidas || 0)
        );
        const position = sorted.findIndex(u => u.id === user.id) + 1;
        document.getElementById('rankPosition').textContent = `#${position}`;

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
});
