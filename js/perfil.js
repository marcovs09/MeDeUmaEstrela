document.addEventListener('DOMContentLoaded', async () => {
    const user = requireAuth();
    if (!user) return;

    try {
        const userData = await getUserData(user.id);
        carregarPerfil(userData);
        configurarTrocaAvatar(user.id);
    } catch (error) {
        console.error('Erro no perfil:', error);
        alert('Erro ao carregar perfil: ' + error.message);
    }
});

// ============================================================
function carregarPerfil(userData) {
    document.getElementById('navAvatar').textContent = userData.avatar_emoji || '🟡';
    document.getElementById('navUsername').textContent = userData.username;
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

    carregarRanking(userData.id);
}

// ============================================================
async function carregarRanking(userId) {
    try {
        const allUsers = await getAllUsers();
        const sorted = [...allUsers].sort((a, b) =>
            (b.estrelas_recebidas || 0) - (a.estrelas_recebidas || 0)
        );
        const position = sorted.findIndex(u => u.id === userId) + 1;
        document.getElementById('rankPosition').textContent = `#${position}`;
    } catch (error) {
        console.error('Erro ao carregar ranking:', error);
    }
}

// ============================================================
// SISTEMA DE TROCAR AVATAR
// ============================================================
let novoAvatarSelecionado = null;
let novoAvatarNome = null;
let userIdAtual = null;

function configurarTrocaAvatar(userId) {
    userIdAtual = userId;

    const btnTrocar = document.getElementById('btnTrocarAvatar');
    if (btnTrocar) {
        btnTrocar.addEventListener('click', abrirModalAvatar);
    }

    const btnConfirmar = document.getElementById('btnConfirmarAvatar');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', confirmarTrocaAvatar);
    }

    // Fechar modal ao clicar fora
    const modal = document.getElementById('avatarModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) fecharModalAvatar();
        });
    }
}

function abrirModalAvatar() {
    const modal = document.getElementById('avatarModal');
    if (!modal) return;

    // Renderizar os avatares no modal
    renderAvatarSelector('avatarSelectorGrid', (emoji, name, index) => {
        novoAvatarSelecionado = emoji;
        novoAvatarNome = name;
    });

    modal.classList.add('active');
    novoAvatarSelecionado = null;
}

function fecharModalAvatar() {
    const modal = document.getElementById('avatarModal');
    if (modal) modal.classList.remove('active');
}

async function confirmarTrocaAvatar() {
    if (!novoAvatarSelecionado || !userIdAtual) {
        alert('⚠️ Selecione um avatar primeiro!');
        return;
    }

    try {
        // Atualizar no banco
        await updateUserPoints(userIdAtual, 'avatar_emoji', novoAvatarSelecionado);
        await updateUserPoints(userIdAtual, 'avatar_name', novoAvatarNome || 'Avatar');

        // Atualizar na tela
        document.getElementById('profileAvatar').textContent = novoAvatarSelecionado;
        document.getElementById('navAvatar').textContent = novoAvatarSelecionado;

        // Fechar modal
        fecharModalAvatar();

        showToast(`✅ Avatar trocado para ${novoAvatarNome}!`, '🎨');

    } catch (error) {
        console.error('Erro ao trocar avatar:', error);
        alert('Erro ao trocar avatar: ' + error.message);
    }
}

// ============================================================
function showToast(message, icon = '⭐') {
    // Remove toast antigo se existir
    const oldToast = document.querySelector('.toast-custom');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-custom';
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
