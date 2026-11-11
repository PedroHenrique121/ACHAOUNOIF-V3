const db = require('../db');
const crypto = require('crypto');

function compararSegredo(valor, esperado) {
    const informado = Buffer.from(String(valor || ''));
    const configurado = Buffer.from(String(esperado || ''));
    return informado.length === configurado.length &&
        informado.length > 0 &&
        crypto.timingSafeEqual(informado, configurado);
}

// Conta fixa legada da equipe, validada no servidor e vinculada a uma linha
// própria do banco. A senha e a chave de assinatura ficam apenas no .env.
exports.loginFuncionarioFixo = (req, res) => {
    const emailConfigurado = String(process.env.FIXED_EMPLOYEE_EMAIL || 'funcionario@jaboatao').trim().toLowerCase();
    const senhaConfigurada = process.env.FIXED_EMPLOYEE_PASSWORD;
    const segredoToken = process.env.STAFF_TOKEN_SECRET;
    const email = String(req.body.email || '').trim().toLowerCase();
    const senha = String(req.body.senha || '');

    if (!senhaConfigurada || !segredoToken) {
        return res.status(503).json({ erro: 'A conta fixa da equipe não está configurada no servidor.' });
    }
    if (!compararSegredo(email, emailConfigurado) || !compararSegredo(senha, senhaConfigurada)) {
        return res.status(401).json({ erro: 'E-mail ou senha de funcionário incorretos.' });
    }

    const uid = 'funcionario-fixo-local';
    db.query(
        `SELECT id_usuario, nome, email, tipo_usuario
         FROM usuarios
         WHERE firebase_uid = ? AND email = ? AND tipo_usuario = 'funcionario'
         LIMIT 1`,
        [uid, emailConfigurado],
        (erro, resultado) => {
            if (erro) return res.status(500).json({ erro: erro.message });
            if (resultado.length === 0) {
                return res.status(409).json({ erro: 'Conta fixa ausente no banco. Implemente a migração de funcionário.' });
            }

            const exp = Math.floor(Date.now() / 1000) + (12 * 60 * 60);
            const corpo = Buffer.from(JSON.stringify({ uid, email: emailConfigurado, exp })).toString('base64url');
            const mensagem = `staff.${corpo}`;
            const assinatura = crypto.createHmac('sha256', segredoToken).update(mensagem).digest('base64url');
            res.json({ token: `${mensagem}.${assinatura}`, perfil: resultado[0] });
        }
    );
};

// Cadastra ou sincroniza o usuário no MySQL após autenticação pelo Firebase.
// O uid vem do TOKEN (validado pelo middleware/auth.js), nunca do body, para
// ninguém conseguir cadastrar/assumir o uid de outra pessoa.
// tipo_usuario nunca vem do cliente: entra como 'usuario' (padrão do banco)
// Funcionários são promovidos pela equipe responsável no banco de dados.
exports.cadastrar =
(req, res) => {

    const nome = String(req.body.nome || req.usuario.name || '').trim();
    const email = String(req.usuario.email || '').trim().toLowerCase();
    const turma = String(req.body.turma || '').trim() || null;
    const firebase_uid = req.usuario.uid;

    if (!nome || !email) {
        return res.status(400).json({ erro: 'Nome e email são obrigatórios' });
    }

    const sql = `
        INSERT INTO usuarios (
            nome,
            email,
            firebase_uid,
            turma
        )
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            nome = COALESCE(NULLIF(nome, ''), VALUES(nome)),
            firebase_uid = VALUES(firebase_uid),
            turma = COALESCE(VALUES(turma), turma)
    `;

    db.query(
        sql,
        [nome, email, firebase_uid, turma],
        (erro) => {

            if (erro) {

                return res.status(500).json({ erro: erro.message });
            }

            res.json({
                sucesso: true
            });
        }
    );
};

// Retorna apenas os dados do perfil associados ao token autenticado.
exports.me = (req, res) => {
    const sql = `
        SELECT id_usuario, nome, email, turma, foto_perfil, tipo_usuario
        FROM usuarios
        WHERE firebase_uid = ?
        LIMIT 1
    `;

    db.query(sql, [req.usuario.uid], (erro, resultado) => {
        if (erro) return res.status(500).json({ erro: erro.message });
        if (resultado.length === 0) {
            return res.status(404).json({ erro: 'Perfil não encontrado' });
        }
        res.json(resultado[0]);
    });
};

// Nome e turma podem ser alterados pelo próprio usuário; email e tipo são imutáveis aqui.
exports.atualizarMeuPerfil = (req, res) => {
    const nome = String(req.body.nome || '').trim();
    const turma = String(req.body.turma || '').trim() || null;

    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });
    if (nome.length > 100 || (turma && turma.length > 50)) {
        return res.status(400).json({ erro: 'Nome ou turma excede o limite permitido' });
    }

    db.query(
        'UPDATE usuarios SET nome = ?, turma = ? WHERE firebase_uid = ?',
        [nome, turma, req.usuario.uid],
        (erro, resultado) => {
            if (erro) return res.status(500).json({ erro: erro.message });
            // usuario middleware already confirmed this authenticated profile exists;
            // affectedRows may be zero when the submitted values are unchanged.
            res.json({ sucesso: true, nome, turma });
        }
    );
};
