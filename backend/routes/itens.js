const express = require('express');

const router = express.Router();

const auth = require('../middleware/auth');

const equipe = require('../middleware/equipe');

const upload = require('../config/multer');

const controller = require('../controllers/itensController');


// Visualização: aberta (aluno e qualquer usuário veem os itens)
router.get('/', controller.listar);

router.get('/:id', controller.buscarPorId);


// Somente funcionários e administradores registram itens.
router.post('/', auth, equipe, upload.single('foto'), controller.cadastrar);

// A equipe do campus gerencia os itens já cadastrados.
router.put('/:id', auth, equipe, upload.single('foto'), controller.atualizar);

router.delete('/:id', auth, equipe, controller.excluir);

module.exports = router;
