const db = require('../db');

exports.listar = (req, res) => {

    db.query(
        'SELECT * FROM categorias ORDER BY nome_categoria',
        (erro, resultado) => {

            if (erro) {
                return res.status(500).json({ erro });
            }

            res.json(resultado);
        }
    );
};
