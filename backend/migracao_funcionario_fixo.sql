-- Execute depois de selecionar o banco achounoif.
-- A senha é configurada no backend/.env, não é armazenada no banco.
INSERT INTO usuarios (nome, email, firebase_uid, tipo_usuario)
VALUES ('Funcionário Jaboatão', 'funcionario@jaboatao', 'funcionario-fixo-local', 'funcionario')
ON DUPLICATE KEY UPDATE
  nome = VALUES(nome),
  firebase_uid = VALUES(firebase_uid),
  tipo_usuario = 'funcionario';
