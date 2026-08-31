// Lista de avatares disponíveis
const AVATARS = [
    { emoji: '🤠', name: 'Cowboy' },
    { emoji: '🧑‍🚀', name: 'Astronauta' },
    { emoji: '👨‍🍳', name: 'Chef' },
    { emoji: '🏴‍☠️', name: 'Pirata' },
    { emoji: '🛡️', name: 'Cavaleiro' },
    { emoji: '🧙', name: 'Mágico' },
    { emoji: '👮', name: 'Policial' },
    { emoji: '🔬', name: 'Cientista' },
    { emoji: '🥷', name: 'Ninja' },
    { emoji: '🧭', name: 'Explorador' },
    { emoji: '🧑‍🌾', name: 'Fazendeiro' },
    { emoji: '👑', name: 'Rei' },
    { emoji: '⚔️', name: 'Samurai' },
    { emoji: '🔍', name: 'Detetive' },
    { emoji: '🪛', name: 'Trabalhador' },
    { emoji: '🧗', name: 'Aventureiro' },
];

// Função para renderizar os avatares
function renderAvatars() {
    const grid = document.getElementById('avatarGrid');
    if (!grid) return;

    AVATARS.forEach((avatar, index) => {
        const div = document.createElement('div');
        div.className = 'avatar-option';
        div.dataset.index = index;
        div.dataset.emoji = avatar.emoji;
        div.dataset.name = avatar.name;
        div.innerHTML = `
            ${avatar.emoji}
            <span class="avatar-label">${avatar.name}</span>
        `;
        div.addEventListener('click', () => selectAvatar(index));
        grid.appendChild(div);
    });
}

// Avatar selecionado
let selectedAvatarIndex = 0;

function selectAvatar(index) {
    const options = document.querySelectorAll('.avatar-option');
    options.forEach((opt, i) => {
        opt.classList.toggle('selected', i === index);
    });
    selectedAvatarIndex = index;
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', renderAvatars);
