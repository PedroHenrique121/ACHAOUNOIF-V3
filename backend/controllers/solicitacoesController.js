const db = require('../db');

// ALUNO/USUÁRIO: faz uma solicitação por um item (ex.: "esse objeto é meu")
exports.criar = (req, res) => {

    const id_objeto = Number(req.body.id_objeto);
    const mensagem = String(req.body.mensagem || '').trim() || null;
    const id_usuario = req.usuarioBanco.id_usuario;

    if (!id_objeto) {
        return res.status(400).json({ erro: 'id_objeto é obrigatório' });
    }

    db.query(
        'SELECT status_objeto FROM objetos_perdidos WHERE id_objeto = ?',
        [id_objeto],
        (erro, objeto) => {

            if (erro) {
                return res.status(500).json({ erro: erro.message });
            }

            if (objeto.length === 0) {
                return res.status(404).json({ erro: 'Item não encontrado' });
            }

            if (objeto[0].status_objeto !== 'perdido') {
                return res.status(409).json({ erro: 'Este item já foi entregue' });
            }

            db.query(
                `SELECT id_solicitacao FROM solicitacoes
                 WHERE id_objeto = ? AND id_usuario = ? AND status = 'pendente'`,
                [id_objeto, id_usuario],
                (erroDup, duplicada) => {

                    if (erroDup) {
                        return res.status(500).json({ erro: erroDup.message });
                    }

                    if (duplicada.length > 0) {
                        return res.status(409).json({
                            erro: 'Você já tem uma solicitação pendente para este item'
                        });
                    }

                    db.query(
                        'INSERT INTO solicitacoes (id_objeto, id_usuario, mensagem) VALUES (?, ?, ?)',
                        [id_objeto, id_usuario, mensagem],
                        (erroIns, resultado) => {

                            if (erroIns) {
                                return res.status(500).json({ erro: erroIns.message });
                            }

                            res.status(201).json({
                                sucesso: true,
                                id_solicitacao: resultado.insertId
                            });
                        }
                    );
                }
            );
        }
    );
};


// ALUNO/USUÁRIO: vê só as próprias solicitações
exports.minhas = (req, res) => {

    const sql = `
        SELECT
            s.id_solicitacao,
            s.id_objeto,
            s.mensagem,
            s.status,
            s.data_solicitacao,
            o.nome_objeto,
            o.foto_principal
        FROM solicitacoes s
        JOIN objetos_perdidos o ON o.id_objeto = s.id_objeto
        WHERE s.id_usuario = ?
        ORDER BY s.data_solicitacao DESC
    `;

    db.query(sql, [req.usuarioBanco.id_usuario], (erro, resultado) => {

        if (erro) {
            return res.status(500).json({ erro: erro.message });
        }

        res.json(resultado);
    });
};


// ADMIN: lista todas as solicitações
exports.listar = (req, res) => {

    const sql = `
        SELECT
            s.id_solicitacao,
            s.id_objeto,
            s.mensagem,
            s.status,
            s.data_solicitacao,
            o.nome_objeto,
            o.foto_principal,
            u.id_usuario,
            u.nome AS nome_usuario,
            u.email AS email_usuario,
            u.turma
        FROM solicitacoes s
        JOIN objetos_perdidos o ON o.id_objeto = s.id_objeto
        JOIN usuarios u ON u.id_usuario = s.id_usuario
        ORDER BY s.status = 'pendente' DESC, s.data_solicitacao DESC
    `;

    db.query(sql, (erro, resultado) => {

        if (erro) {
            return res.status(500).json({ erro: erro.message });
        }

        res.json(resultado);
    });
};


// ADMIN: aprova ou recusa. Aprovada -> o item vira 'entregue' e o solicitante vira o dono.
exports.atualizar = (req, res) => {

    const { id } = req.params;
    const { status } = req.body;

    if (!['aprovada', 'recusada'].includes(status)) {
        return res.status(400).json({ erro: "status deve ser 'aprovada' ou 'recusada'" });
    }

    db.query(
        'SELECT id_objeto, id_usuario FROM solicitacoes WHERE id_solicitacao = ?',
        [id],
        (erro, busca) => {

            if (erro) {
                return res.status(500).json({ erro: erro.message });
            }

            if (busca.length === 0) {
                return res.status(404).json({ erro: 'Solicitação não encontrada' });
            }

            const { id_objeto, id_usuario } = busca[0];

            db.query(
                'UPDATE solicitacoes SET status = ? WHERE id_solicitacao = ?',
                [status, id],
                (erroUp) => {

                    if (erroUp) {
                        return res.status(500).json({ erro: erroUp.message });
                    }

                    if (status !== 'aprovada') {
                        return res.json({ sucesso: true });
                    }

                    db.query(
                        `UPDATE objetos_perdidos
                         SET status_objeto = 'entregue', id_dono_objeto = ?
                         WHERE id_objeto = ?`,
                        [id_usuario, id_objeto],
                        (erroObj) => {

                            if (erroObj) {
                                return res.status(500).json({ erro: erroObj.message });
                            }

                            res.json({ sucesso: true });
                        }
                    );
                }
            );
        }
    );
};
