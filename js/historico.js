document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth();
    if (!user) return;

    try {
        const userData = await getUserData(user.id);
        document.getElementById('navAvatar').textContent = userData.avatar_emoji || '🟡';
        document.getElementById('navUsername').textContent = userData.username;

        const history = await getHistory(50);
        const container = document.getElementById('historicoList');

        if (history.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:40px 0;color:#b8956a;">
                    <div style="font-size:3rem;margin-bottom:10px;">📭</div>
                    <p>Nenhuma ação registrada ainda.</p>
                    <p style="font-size:0.9rem;font-weight:400;">Seja o primeiro a dar uma estrela!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = history.map(item => {
            const isStar = item.type === 'star';
            const icon = isStar ? '⭐' : '🍅';
            const fromName = item.from_user?.username || 'Alguém';
            const toName = item.to_user?.username || 'alguém';
            const time = new Date(item.created_at).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="historico-item ${isStar ? 'star-item' : 'tomato-item'}">
                    <span class="time">${time}</span>
                    <span class="icon">${icon}</span>
                    <span class="action-text">
                        <strong>${fromName}</strong>
                        ${item.action}
                        <strong>${toName}</strong>
                    </span>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Erro no histórico:', error);
        document.getElementById('historicoList').innerHTML = `
            <p style="text-align:center;color:#e74c3c;">Erro ao carregar histórico: ${error.message}</p>
        `;
    }
});
