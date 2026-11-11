const carregarUsuario = require('./usuario');

// Só passa quem é tipo_usuario = 'admin' no MySQL. Usar depois do middleware/auth.js.
module.exports = (req, res, next) => {

    carregarUsuario(req, res, () => {

        if (req.usuarioBanco.tipo_usuario !== 'admin') {
            return res.status(403).json({
                erro: 'Apenas administradores podem realizar esta operação.'
            });
        }

        next();
    });
};
