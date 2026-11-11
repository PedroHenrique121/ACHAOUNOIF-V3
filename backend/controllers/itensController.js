const db = require('../db');
const fs = require('fs');
const path = require('path');

const pastaUploads = path.join(__dirname, '..', 'uploads');

function removerArquivoAntigo(nomeArquivo){
    if (!nomeArquivo) return;

    const caminho = path.join(pastaUploads, nomeArquivo);

    fs.unlink(caminho, (erro) => {
        // ignora erro se o arquivo já não existir
    });
}

// LISTAR TODOS OS ITENS (com nome da categoria via JOIN)
exports.listar = (req, res) => {

    const sql = `
        SELECT
            o.id_objeto,
            o.codigo_rastreio,
            o.nome_objeto,
            o.descricao,
            o.data_encontro,
            o.local_encontro,
            o.foto_principal,
            o.estado_objeto,
            o.status_objeto,
            o.id_categoria,
            o.id_usuario_cadastro,
            o.id_dono_objeto,
            c.nome_categoria,
            o.data_registro
        FROM objetos_perdidos o
        LEFT JOIN categorias c ON c.id_categoria = o.id_categoria
        ORDER BY o.data_registro DESC
    `;

    db.query(sql, (erro, resultado) => {

        if (erro) {
            return res.status(500).json({ erro });
        }

        res.json(resultado);
    });
};


// BUSCAR ITEM POR ID
exports.buscarPorId = (req, res) => {

    const { id } = req.params;

    db.query(
        'SELECT * FROM objetos_perdidos WHERE id_objeto = ?',
        [id],
        (erro, resultado) => {

            if (erro) {
                return res.status(500).json({ erro });
            }

            if (resultado.length === 0) {
                return res.status(404).json({ erro: 'Item não encontrado' });
            }

            res.json(resultado[0]);
        }
    );
};


// CADASTRAR NOVO ITEM
exports.cadastrar = (req, res) => {

    const {
        nome_objeto,
        descricao,
        data_encontro,
        local_encontro,
        estado_objeto,
        status_objeto,
        id_categoria,
        nome_categoria
    } = req.body;

    if (!nome_objeto || !data_encontro || !local_encontro || !estado_objeto) {
        return res.status(400).json({
            erro: 'Campos obrigatórios faltando (nome_objeto, data_encontro, local_encontro, estado_objeto)'
        });
    }

    // Foto vem sempre de upload de arquivo (multer)
    const foto = req.file ? req.file.filename : null;

    const codigo = 'OBJ-' + Date.now();

    const cadastrarComCategoria = (categoriaId) => {
        const sql = `
            INSERT INTO objetos_perdidos (
                codigo_rastreio,
                nome_objeto,
                descricao,
                data_encontro,
                local_encontro,
                foto_principal,
                estado_objeto,
                status_objeto,
                id_categoria,
                id_usuario_cadastro
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
            sql,
            [
                codigo,
                nome_objeto,
                descricao || null,
                data_encontro,
                local_encontro,
                foto,
                estado_objeto,
                status_objeto || 'perdido',
                categoriaId,
                req.usuarioBanco ? req.usuarioBanco.id_usuario : null
            ],
            (erro, resultado) => {
                if (erro) return res.status(500).json({ erro });
                res.json({
                    sucesso: true,
                    id_objeto: resultado.insertId,
                    codigo_rastreio: codigo
                });
            }
        );
    };

    // Mantém compatibilidade com clientes antigos que ainda enviam o ID.
    if (id_categoria) {
        return cadastrarComCategoria(id_categoria);
    }

    const nomeCategoriaLimpo = String(nome_categoria || '').trim();
    if (!nomeCategoriaLimpo) {
        return res.status(400).json({ erro: 'Informe a categoria do objeto' });
    }

    db.query(
        'SELECT id_categoria FROM categorias WHERE nome_categoria = ? LIMIT 1',
        [nomeCategoriaLimpo],
        (erro, resultado) => {
            if (erro) return res.status(500).json({ erro });
            if (resultado.length === 0) {
                return res.status(400).json({ erro: 'Categoria não cadastrada no banco de dados' });
            }
            cadastrarComCategoria(resultado[0].id_categoria);
        }
    );
};


// ATUALIZAR ITEM EXISTENTE
exports.atualizar = (req, res) => {

    const { id } = req.params;

    const {
        nome_objeto,
        descricao,
        data_encontro,
        local_encontro,
        estado_objeto,
        status_objeto,
        id_categoria
    } = req.body;

    const novaFoto = req.file ? req.file.filename : undefined;

    const campos = [];
    const valores = [];

    const possiveis = {
        nome_objeto,
        descricao,
        data_encontro,
        local_encontro,
        estado_objeto,
        status_objeto,
        id_categoria,
        foto_principal: novaFoto
    };

    for (const chave in possiveis) {
        if (possiveis[chave] !== undefined) {
            campos.push(`${chave} = ?`);
            valores.push(possiveis[chave]);
        }
    }

    if (campos.length === 0) {
        return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
    }

    valores.push(id);

    const sql = `
        UPDATE objetos_perdidos
        SET ${campos.join(', ')}
        WHERE id_objeto = ?
    `;

    // Se uma nova foto foi enviada, busca a foto antiga antes de sobrescrever, pra apagar depois
    const continuarAtualizacao = (fotoAntiga) => {

        db.query(sql, valores, (erro, resultado) => {

            if (erro) {
                return res.status(500).json({ erro });
            }

            if (resultado.affectedRows === 0) {
                return res.status(404).json({ erro: 'Item não encontrado' });
            }

            if (novaFoto && fotoAntiga && fotoAntiga !== novaFoto) {
                removerArquivoAntigo(fotoAntiga);
            }

            res.json({ sucesso: true });
        });
    };

    if (novaFoto) {
        db.query(
            'SELECT foto_principal FROM objetos_perdidos WHERE id_objeto = ?',
            [id],
            (erro, resultado) => {

                if (erro) {
                    return res.status(500).json({ erro });
                }

                const fotoAntiga = resultado[0]?.foto_principal;
                continuarAtualizacao(fotoAntiga);
            }
        );
    } else {
        continuarAtualizacao(null);
    }
};


// EXCLUIR ITEM
exports.excluir = (req, res) => {

    const { id } = req.params;

    db.query(
        'SELECT foto_principal FROM objetos_perdidos WHERE id_objeto = ?',
        [id],
        (erroBusca, resultadoBusca) => {

            if (erroBusca) {
                return res.status(500).json({ erro: erroBusca });
            }

            const foto = resultadoBusca[0]?.foto_principal;

            db.query(
                'DELETE FROM objetos_perdidos WHERE id_objeto = ?',
                [id],
                (erro, resultado) => {

                    if (erro) {
                        return res.status(500).json({ erro });
                    }

                    if (resultado.affectedRows === 0) {
                        return res.status(404).json({ erro: 'Item não encontrado' });
                    }

                    removerArquivoAntigo(foto);

                    res.json({ sucesso: true });
                }
            );
        }
    );
};
