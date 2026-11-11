-- Para bancos JÁ criados: adiciona a tabela de solicitações.
CREATE TABLE IF NOT EXISTS solicitacoes (
    id_solicitacao INT AUTO_INCREMENT PRIMARY KEY,
    id_objeto INT NOT NULL,
    id_usuario INT NOT NULL,
    mensagem TEXT,
    status ENUM('pendente', 'aprovada', 'recusada') DEFAULT 'pendente',
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_objeto) REFERENCES objetos_perdidos(id_objeto) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Para tornar alguém administrador:
-- UPDATE usuarios SET tipo_usuario = 'admin' WHERE email = 'email@exemplo.com';
