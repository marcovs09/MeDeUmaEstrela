// ===== CONFIGURAÇÃO SUPABASE =====
// ⚠️ COPIE EXATAMENTE DO SEU SUPABASE: Settings > API
const SUPABASE_URL = 'https://onafctklpgqokudrbcnd.supabase.co';  // Confirme se está certo!
const SUPABASE_KEY = 'sb_publishable_bN1oyjkg-d0YaoaQwnC8hA_USqEn660';  // Confirme se está certo!

// Inicializar cliente Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== CADASTRO =====
document.addEventListener('DOMContentLoaded', () => {
    const cadastroForm = document.getElementById('cadastroForm');
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', handleCadastro);
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleCadastro(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Verifica se o avatar foi selecionado
    let avatarEmoji = '🟡';
    let avatarName = 'Amigo';
    
    // Tenta pegar o avatar selecionado (se a função existir)
    if (typeof selectedAvatarIndex !== 'undefined' && typeof AVATARS !== 'undefined') {
        avatarEmoji = AVATARS[selectedAvatarIndex]?.emoji || '🟡';
        avatarName = AVATARS[selectedAvatarIndex]?.name || 'Amigo';
    }

    if (!username || username.length < 3) {
        alert('Nome de usuário precisa ter pelo menos 3 caracteres.');
        return;
    }

    if (password.length < 6) {
        alert('Senha precisa ter pelo menos 6 caracteres.');
        return;
    }

    try {
        // 1. Criar usuário no Supabase Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: `${username}@temp.medeumaestrela.com`,
            password: password,
        });

        if (authError) throw authError;

        // 2. Salvar dados do usuário na tabela 'usuarios'
        const { error: dbError } = await supabaseClient
            .from('usuarios')
            .insert({
                id: authData.user.id,
                username: username,
                avatar_emoji: avatarEmoji,
                avatar_name: avatarName,
                estrelas_disponiveis: 1,
                tomates_disponiveis: 1,
                estrelas_recebidas: 0,
                tomates_recebidos: 0,
                estrelas_dadas: 0,
                tomates_dados: 0,
                ultimo_acesso: new Date().toISOString(),
            });

        if (dbError) throw dbError;

        alert('Conta criada com sucesso! ⭐');
        window.location.href = 'login.html';

    } catch (error) {
        console.error('Erro no cadastro:', error);
        alert('Erro ao criar conta: ' + error.message);
    }
}

// ===== LOGIN =====
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('Preencha todos os campos.');
        return;
    }

    try {
        // 1. Buscar usuário pelo username
        const { data: userData, error: userError } = await supabaseClient
            .from('usuarios')
            .select('id, username')
            .eq('username', username)
            .single();

        if (userError || !userData) {
            alert('Usuário não encontrado. Verifique o nome ou crie uma conta.');
            return;
        }

        // 2. Autenticar com email temporário
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email: `${username}@temp.medeumaestrela.com`,
            password: password,
        });

        if (authError) {
            alert('Senha incorreta. Tente novamente.');
            return;
        }

        // 3. Salvar sessão
        localStorage.setItem('user_id', userData.id);
        localStorage.setItem('username', username);

        // 4. Redirecionar
        window.location.href = 'principal.html';

    } catch (error) {
        console.error('Erro no login:', error);
        alert('Erro ao fazer login: ' + error.message);
    }
}

// ===== VERIFICAR SESSÃO =====
function getCurrentUser() {
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');
    if (userId && username) {
        return { id: userId, username };
    }
    return null;
}

function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
    }
    return user;
}

function logout() {
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}
