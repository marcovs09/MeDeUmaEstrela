// ============================================================
// LISTA DE AVATARES — 50+ EMOJIS DIVERTIDOS
// ============================================================

const AVATARS = [
    // 🧑‍🚀 Profissões e fantasias
    { emoji: '🧑‍🚀', name: 'Astronauta' },
    { emoji: '🧑‍🍳', name: 'Chef' },
    { emoji: '🧑‍🏫', name: 'Professor' },
    { emoji: '🧑‍⚕️', name: 'Médico' },
    { emoji: '🧑‍🔬', name: 'Cientista' },
    { emoji: '🧑‍💻', name: 'Programador' },
    { emoji: '🧑‍🎤', name: 'Cantor' },
    { emoji: '🧑‍🎨', name: 'Artista' },
    { emoji: '🧑‍🚒', name: 'Bombeiro' },
    { emoji: '🧑‍✈️', name: 'Piloto' },
    { emoji: '🧑‍🌾', name: 'Fazendeiro' },
    { emoji: '🧑‍🍼', name: 'Babá' },
    { emoji: '🧑‍🦯', name: 'Explorador' },
    { emoji: '🧑‍🦰', name: 'Ruivo' },
    { emoji: '🧑‍🦳', name: 'Loira' },
    { emoji: '🧑‍🦱', name: 'Cacheados' },
    { emoji: '🧑‍🦲', name: 'Careca' },

    // 🦸 Heróis e personagens
    { emoji: '🦸‍♂️', name: 'Super-herói' },
    { emoji: '🦸‍♀️', name: 'Super-heroína' },
    { emoji: '🦹‍♂️', name: 'Vilão' },
    { emoji: '🦹‍♀️', name: 'Vilã' },
    { emoji: '🧙‍♂️', name: 'Mago' },
    { emoji: '🧙‍♀️', name: 'Bruxa' },
    { emoji: '🧝‍♂️', name: 'Elfo' },
    { emoji: '🧝‍♀️', name: 'Elfa' },
    { emoji: '🧛‍♂️', name: 'Vampiro' },
    { emoji: '🧛‍♀️', name: 'Vampira' },
    { emoji: '🧟‍♂️', name: 'Zumbi' },
    { emoji: '🧟‍♀️', name: 'Zumbi' },
    { emoji: '🧚‍♂️', name: 'Fada' },
    { emoji: '🧚‍♀️', name: 'Fada' },
    { emoji: '🧜‍♂️', name: 'Sereio' },
    { emoji: '🧜‍♀️', name: 'Sereia' },

    // 🦁 Animais fofos
    { emoji: '🦊', name: 'Raposa' },
    { emoji: '🐺', name: 'Lobo' },
    { emoji: '🦝', name: 'Guaxinim' },
    { emoji: '🐱', name: 'Gato' },
    { emoji: '🐶', name: 'Cachorro' },
    { emoji: '🐰', name: 'Coelho' },
    { emoji: '🐼', name: 'Panda' },
    { emoji: '🐨', name: 'Coala' },
    { emoji: '🦁', name: 'Leão' },
    { emoji: '🐯', name: 'Tigre' },
    { emoji: '🐮', name: 'Vaca' },
    { emoji: '🐷', name: 'Porco' },
    { emoji: '🐸', name: 'Sapo' },
    { emoji: '🐵', name: 'Macaco' },
    { emoji: '🦄', name: 'Unicórnio' },
    { emoji: '🐲', name: 'Dragão' },
    { emoji: '🦉', name: 'Coruja' },
    { emoji: '🐧', name: 'Pinguim' },
    { emoji: '🐦', name: 'Pássaro' },
    { emoji: '🦋', name: 'Borboleta' },
    { emoji: '🐝', name: 'Abelha' },

    // 🎭 Emojis variados
    { emoji: '🤖', name: 'Robô' },
    { emoji: '👾', name: 'Alien' },
    { emoji: '🎃', name: 'Abóbora' },
    { emoji: '👻', name: 'Fantasma' },
    { emoji: '💀', name: 'Caveira' },
    { emoji: '🤡', name: 'Palhaço' },
    { emoji: '👽', name: 'Extraterrestre' },
    { emoji: '😺', name: 'Gato Feliz' },
    { emoji: '😸', name: 'Gato Sorridente' },
    { emoji: '😻', name: 'Gato Apaixonado' },
    { emoji: '🙈', name: 'Macaco Cego' },
    { emoji: '🙉', name: 'Macaco Surdo' },
    { emoji: '🙊', name: 'Macaco Mudo' },

    // 👑 Realeza e mitologia
    { emoji: '👑', name: 'Rei' },
    { emoji: '👸', name: 'Rainha' },
    { emoji: '🤴', name: 'Príncipe' },
    { emoji: '👰‍♀️', name: 'Noiva' },
    { emoji: '🤵‍♂️', name: 'Noivo' },
    { emoji: '⛑️', name: 'Socorrista' },
    { emoji: '🎅', name: 'Papai Noel' },
    { emoji: '🧑‍🎄', name: 'Elfo Natalino' },
    { emoji: '🦌', name: 'Rena' },
];

// Avatar selecionado (global)
let selectedAvatarIndex = 0;

// ============================================================
// RENDERIZAR AVATARES NA TELA DE CADASTRO
// ============================================================
function renderAvatars() {
    const grid = document.getElementById('avatarGrid');
    if (!grid) return;

    grid.innerHTML = '';

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

    // Selecionar o primeiro por padrão
    selectAvatar(0);
}

// ============================================================
// SELECIONAR AVATAR
// ============================================================
function selectAvatar(index) {
    const options = document.querySelectorAll('.avatar-option');
    options.forEach((opt, i) => {
        opt.classList.toggle('selected', i === index);
    });
    selectedAvatarIndex = index;
}

// ============================================================
// TROCAR AVATAR (para perfil)
// ============================================================
function renderAvatarSelector(containerId, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    AVATARS.forEach((avatar, index) => {
        const div = document.createElement('div');
        div.className = 'avatar-option avatar-selector-option';
        div.dataset.index = index;
        div.dataset.emoji = avatar.emoji;
        div.dataset.name = avatar.name;
        div.innerHTML = `
            ${avatar.emoji}
            <span class="avatar-label">${avatar.name}</span>
        `;
        div.addEventListener('click', () => {
            // Remove seleção anterior
            container.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            if (onSelect) onSelect(avatar.emoji, avatar.name, index);
        });
        container.appendChild(div);
    });
}

// ============================================================
// INICIALIZAR
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    // Se estiver na página de cadastro, renderiza os avatares
    if (document.getElementById('avatarGrid')) {
        renderAvatars();
    }
});
