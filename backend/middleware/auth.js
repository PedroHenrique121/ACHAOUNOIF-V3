const admin = require('../firebase');
const crypto = require('crypto');

function validarTokenFuncionario(token) {
    const segredo = process.env.STAFF_TOKEN_SECRET;
    if (!segredo || !token.startsWith('staff.')) return null;

    const partes = token.split('.');
    if (partes.length !== 3) return null;
    const mensagem = `${partes[0]}.${partes[1]}`;
    const assinaturaEsperada = crypto.createHmac('sha256', segredo).update(mensagem).digest();
    let assinaturaInformada;
    try {
        assinaturaInformada = Buffer.from(partes[2], 'base64url');
    } catch {
        return null;
    }
    if (assinaturaInformada.length !== assinaturaEsperada.length ||
        !crypto.timingSafeEqual(assinaturaInformada, assinaturaEsperada)) return null;

    try {
        const corpo = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8'));
        const emailFixo = String(process.env.FIXED_EMPLOYEE_EMAIL || 'funcionario@jaboatao').trim().toLowerCase();
        if (corpo.uid !== 'funcionario-fixo-local' || corpo.email !== emailFixo || corpo.exp <= Math.floor(Date.now() / 1000)) return null;
        return { uid: corpo.uid, email: corpo.email, role: 'funcionario' };
    } catch {
        return null;
    }
}

module.exports =
async (req, res, next) => {

    try {

        const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

        if (!token) {

            return res.status(401).json({
                erro: 'Token não enviado'
            });
        }

        if (token.startsWith('staff.')) {
            const funcionario = validarTokenFuncionario(token);
            if (!funcionario) return res.status(401).json({ erro: 'Token de funcionário inválido ou expirado.' });
            req.usuario = funcionario;
            return next();
        }

        if (!admin) {
            return res.status(503).json({
                erro: 'Autenticação Firebase não configurada no servidor.'
            });
        }

        const decoded =
            await admin.auth()
            .verifyIdToken(token);

        req.usuario = decoded;

        next();

    } catch (erro) {

    console.error('Erro ao validar token Firebase:', erro.message);

    return res.status(401).json({
        erro: 'Token inválido'
    });
}
};
