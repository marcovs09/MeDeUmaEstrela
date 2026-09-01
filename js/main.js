// ===== VARIÁVEIS GLOBAIS =====
let currentUser = null;
let allUsers = [];
let userData = null;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth();
    if (!user) return;

    currentUser = user;

    try {
        userData = await getUserData(user.id);
        await dailyUpdate(user.id);
        userData = await getUserData(user.id);

        updateNavbar();
        updateBalance();
        await loadFriends();
        setRandomPhrase();

        // ⭐ INICIAR CRONÔMETRO (GLOBAL)
        await iniciarCronometro();

        document.getElementById('actionModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeModal();
        });

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar seus dados. Tente recarregar.');
    }
});

// ===== ATUALIZAR NAVBAR =====
function updateNavbar() {
    document.getElementById('navAvatar').textContent = userData.avatar_emoji || '🟡';
    document.getElementById('navUsername').textContent = userData.username;
}

// ===== ATUALIZAR SALDO =====
function updateBalance() {
    const starEl = document.getElementById('starCount');
    const tomatoEl = document.getElementById('tomatoCount');

    const stars = userData.estrelas_disponiveis || 0;
    const tomatoes = userData.tomates_disponiveis || 0;

    starEl.textContent = stars > 0 ? `${stars} disponível` : '0 disponível';
    tomatoEl.textContent = tomatoes > 0 ? `${tomatoes} disponível` : '0 disponível';
}

// ===== CARREGAR LISTA DE AMIGOS =====
async function loadFriends() {
    try {
        allUsers = await getAllUsers();
        const grid = document.getElementById('friendsGrid');
        grid.innerHTML = '';

        const friends = allUsers.filter(u => u.id !== currentUser.id);

        if (friends.length === 0) {
            grid.innerHTML = `<p style="text-align:center;color:#b8956a;grid-column:1/-1;">
                ⭐ Nenhum amigo encontrado. Convide mais pessoas!
            </p>`;
            return;
        }

        friends.forEach(friend => {
            const card = createFriendCard(friend);
            grid.appendChild(card);
        });

    } catch (error) {
        console.error('Erro ao carregar amigos:', error);
    }
}

// ===== CRIAR CARD DE AMIGO =====
function createFriendCard(friend) {
    const card = document.createElement('div');
    card.className = 'friend-card';

    const reputation = (friend.estrelas_recebidas || 0) - (friend.tomates_recebidos || 0);
    const repText = reputation >= 0 ? `+${reputation}` : `${reputation}`;
    const repColor = reputation >= 0 ? '#27ae60' : '#e74c3c';

    card.innerHTML = `
        <span class="card-avatar">${friend.avatar_emoji || '🟡'}</span>
        <div class="card-name">${friend.username}</div>
        <div class="card-stats">
            <span class="stars">⭐ ${friend.estrelas_recebidas || 0}</span>
            <span class="tomatoes">🍅 ${friend.tomates_recebidos || 0}</span>
            <span style="color:${repColor};font-weight:800;">${repText}</span>
        </div>
        <div class="card-actions">
            <button class="btn-action btn-star" data-userid="${friend.id}" data-action="star">
                ⭐ Dar estrela
            </button>
            <button class="btn-action btn-tomato" data-userid="${friend.id}" data-action="tomato">
                🍅 Jogar tomate
            </button>
        </div>
    `;

    card.querySelectorAll('.btn-action').forEach(btn => {
        btn.addEventListener('click', () => handleAction(btn.dataset.userid, btn.dataset.action));
        const action = btn.dataset.action;
        if (action === 'star' && (userData.estrelas_disponiveis || 0) <= 0) {
            btn.disabled = true;
            btn.title = 'Você não tem estrelas disponíveis';
        }
        if (action === 'tomato' && (userData.tomates_disponiveis || 0) <= 0) {
            btn.disabled = true;
            btn.title = 'Você não tem tomates disponíveis';
        }
    });

    return card;
}

// ===== AÇÕES =====
let pendingAction = null;

function handleAction(targetUserId, actionType) {
    if (targetUserId === currentUser.id) {
        const phrases = [
            'Ei! Você não pode dar estrela para você mesmo 😂',
            'Autoestrela? Que tal dar para um amigo? 🤭',
            'Você é muito bom, mas não pode se dar estrelas! ⭐',
            'Tomate em si mesmo? Isso é estranho... 🍅'
        ];
        alert(phrases[Math.floor(Math.random() * phrases.length)]);
        return;
    }

    const targetUser = allUsers.find(u => u.id === targetUserId);
    if (!targetUser) return;

    const actionVerb = actionType === 'star' ? 'DAR ESTRELA' : 'JOGAR TOMATE';
    const icon = actionType === 'star' ? '⭐' : '🍅';

    const modal = document.getElementById('actionModal');
    document.getElementById('modalIcon').textContent = icon;
    document.getElementById('modalTitle').textContent = actionVerb;
    document.getElementById('modalMessage').textContent =
        `Você quer ${actionType === 'star' ? 'dar uma estrela' : 'jogar um tomate'} para ${targetUser.username}?`;

    const confirmBtn = document.getElementById('modalConfirmBtn');
    confirmBtn.textContent = `${icon} Confirmar`;
    confirmBtn.onclick = () => confirmAction(targetUserId, actionType);

    pendingAction = { targetUserId, actionType };
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('actionModal').classList.remove('active');
    pendingAction = null;
}

async function confirmAction(targetUserId, actionType) {
    closeModal();

    try {
        const targetUser = allUsers.find(u => u.id === targetUserId);

        if (actionType === 'star') {
            await giveStar(currentUser.id, targetUserId);
        } else {
            await giveTomato(currentUser.id, targetUserId);
        }

        userData = await getUserData(currentUser.id);
        updateBalance();

        const emoji = actionType === 'star' ? '⭐' : '🍅';
        const messages = actionType === 'star'
            ? [
                `✨ Uma estrela acaba de cair do céu para ${targetUser.username}! ⭐`,
                `⭐ ${targetUser.username} mereceu essa estrela!`,
                `🌟 Brilhou! ${targetUser.username} ganhou uma estrela!`,
            ]
            : [
                `💥 ${targetUser.username} levou um tomate na cara! 🍅`,
                `🍅 TOMATE! ${targetUser.username} foi tomateado!`,
                `🤡 ${targetUser.username} pediu por isso! 🍅`,
            ];

        const msg = messages[Math.floor(Math.random() * messages.length)];
        showToast(msg, emoji);

        await loadFriends();

    } catch (error) {
        console.error('Erro na ação:', error);
        alert(error.message || 'Erro ao realizar ação.');
    }
}

// ===== TOAST =====
function showToast(message, icon = '⭐') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        padding: 16px 28px;
        border-radius: 20px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.12);
        font-family: 'Nunito', sans-serif;
        font-weight: 700;
        z-index: 300;
        animation: modalPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        border: 1px solid rgba(255,215,0,0.15);
        font-size: 1.05rem;
        color: #4a3520;
        max-width: 90%;
    `;
    toast.textContent = `${icon} ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.4s';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// ===== FRASE ALEATÓRIA =====
const phrases = [
    '✨ Distribua amor. Ou tomates. ✨',
    '⭐ Quem merece uma estrela hoje?',
    '🍅 Quem está pedindo um tomate?',
    '🌟 Faça alguém brilhar hoje!',
    '😂 A brincadeira favorita do grupo!',
    '👑 Um dia, uma estrela por vez.',
    '🤡 Cuidado com os tomates por aí...',
    '🎉 Seja legal! Ou não. É sua escolha.',
];

function setRandomPhrase() {
    const el = document.getElementById('funPhrase');
    if (el) {
        el.textContent = phrases[Math.floor(Math.random() * phrases.length)];
    }
}
