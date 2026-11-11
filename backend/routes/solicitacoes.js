const express = require('express');

const router = express.Router();

const auth = require('../middleware/auth');

const usuario = require('../middleware/usuario');

const equipe = require('../middleware/equipe');

const controller = require('../controllers/solicitacoesController');


// Aluno/usuário logado: cria e acompanha as próprias solicitações
router.post('/', auth, usuario, controller.criar);

router.get('/minhas', auth, usuario, controller.minhas);


// Funcionários e administradores veem e analisam as solicitações.
router.get('/', auth, equipe, controller.listar);

router.put('/:id', auth, equipe, controller.atualizar);

module.exports = router;
