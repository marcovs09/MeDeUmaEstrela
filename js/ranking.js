document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth();
    if (!user) return;

    try {
        const userData = await getUserData(user.id);
        document.getElementById('navAvatar').textContent = userData.avatar_emoji || '🟡';
        document.getElementById('navUsername').textContent = userData.username;

        const allUsers = await getAllUsers();

        const sortedStars = [...allUsers].sort((a, b) =>
            (b.estrelas_recebidas || 0) - (a.estrelas_recebidas || 0)
        );
        renderRanking('rankingStars', sortedStars, 'estrelas_recebidas', '⭐');

        const sortedTomatoes = [...allUsers].sort((a, b) =>
            (b.tomates_recebidos || 0) - (a.tomates_recebidos || 0)
        );
        renderRanking('rankingTomatoes', sortedTomatoes, 'tomates_recebidos', '🍅');

        const sortedRep = [...allUsers].sort((a, b) => {
            const repA = (a.estrelas_recebidas || 0) - (a.tomates_recebidos || 0);
            const repB = (b.estrelas_recebidas || 0) - (b.tomates_recebidos || 0);
            return repB - repA;
        });
        renderRanking('rankingReputation', sortedRep, 'reputation', '🏆');

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.ranking-list').forEach(l => l.classList.add('hidden'));
                const target = document.getElementById(`ranking${btn.dataset.tab.charAt(0).toUpperCase() + btn.dataset.tab.slice(1)}`);
                if (target) target.classList.remove('hidden');
            });
        });

    } catch (error) {
        console.error('Erro no ranking:', error);
        document.querySelector('.ranking-container').innerHTML = `
            <p style="text-align:center;color:#e74c3c;">Erro ao carregar ranking: ${error.message}</p>
        `;
    }
});

function renderRanking(containerId, users, field, icon) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (users.length === 0) {
        container.innerHTML = `<p style="text-align:center;color:#b8956a;">Nenhum dado ainda.</p>`;
        return;
    }

    container.innerHTML = users.map((user, index) => {
        const pos = index + 1;
        let posClass = '';
        if (pos === 1) posClass = 'gold';
        else if (pos === 2) posClass = 'silver';
        else if (pos === 3) posClass = 'bronze';

        const value = field === 'reputation'
            ? (user.estrelas_recebidas || 0) - (user.tomates_recebidos || 0)
            : user[field] || 0;

        const displayValue = field === 'reputation'
            ? (value >= 0 ? `+${value}` : `${value}`)
            : `${icon} ${value}`;

        return `
            <div class="ranking-item">
                <span class="ranking-position ${posClass}">#${pos}</span>
                <span class="ranking-avatar">${user.avatar_emoji || '🟡'}</span>
                <span class="ranking-name">${user.username}</span>
                <span class="ranking-score">${displayValue}</span>
            </div>
        `;
    }).join('');
}
