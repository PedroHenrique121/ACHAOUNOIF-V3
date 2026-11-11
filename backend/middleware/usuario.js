const db = require('../db');

// Roda depois do middleware/auth.js: busca no MySQL o usuário dono do token Firebase
// e deixa em req.usuarioBanco (id_usuario, nome, email, turma, tipo_usuario).
module.exports = (req, res, next) => {

    db.query(
        `SELECT id_usuario, nome, email, turma, tipo_usuario
         FROM usuarios
         WHERE firebase_uid = ?
         LIMIT 1`,
        [req.usuario.uid],
        (erro, resultado) => {

            if (erro) {
                return res.status(500).json({ erro: erro.message });
            }

            if (resultado.length === 0) {
                return res.status(403).json({
                    erro: 'Usuário não encontrado no banco. Faça o cadastro novamente.'
                });
            }

            req.usuarioBanco = resultado[0];
            next();
        }
    );
};
