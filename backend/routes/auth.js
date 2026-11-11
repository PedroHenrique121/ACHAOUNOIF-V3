const express = require('express');

const router = express.Router();

const auth = require('../middleware/auth');

const controller =
require('../controllers/authController');

const usuario = require('../middleware/usuario');

router.post('/funcionario/login', controller.loginFuncionarioFixo);

router.post(
    '/',
    auth,
    controller.cadastrar
);

router.get('/me', auth, usuario, controller.me);
router.put('/me', auth, usuario, controller.atualizarMeuPerfil);

module.exports = router;
