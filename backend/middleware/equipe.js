const carregarUsuario = require('./usuario');

// Funcionários e administradores podem gerenciar itens e solicitações.
module.exports = (req, res, next) => {
    carregarUsuario(req, res, () => {
        if (!['funcionario', 'admin'].includes(req.usuarioBanco.tipo_usuario)) {
            return res.status(403).json({
                erro: 'Apenas funcionários e administradores podem realizar esta operação.'
            });
        }
        next();
    });
};
