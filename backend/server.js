require('dotenv').config();

const express = require('express');

const cors = require('cors');

const path = require('path');

const app = express();

app.use(cors());

app.use(express.json());


// IMAGENS
app.use(
    '/uploads',
    express.static(
        path.join(__dirname, 'uploads')
    )
);


// ROTAS
const authRoutes =
    require('./routes/auth');

const itensRoutes =
    require('./routes/itens');

const categoriasRoutes =
    require('./routes/categorias');

const solicitacoesRoutes =
    require('./routes/solicitacoes');

app.get('/health', (req, res) => {
    require('./db').query('SELECT 1', (erro) => {
        if (erro) {
            return res.status(500).json({ ok: false, banco: 'erro', erro: erro.message });
        }
        res.json({ ok: true, banco: 'conectado' });
    });
});

app.use('/usuarios', authRoutes);

app.use('/solicitacoes', solicitacoesRoutes);

app.use('/itens', itensRoutes);

app.use('/categorias', categoriasRoutes);


const PORT =
    process.env.PORT || 8080;

app.listen(PORT, () => {

    console.log(
        `Servidor rodando na porta ${PORT}`
    );
});