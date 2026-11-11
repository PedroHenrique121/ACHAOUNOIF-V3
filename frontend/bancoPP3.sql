CREATE DATABASE IF NOT EXISTS achounoif
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE achounoif;

-- Active: 1793966500006@@127.0.0.1@3306@achounoif

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NULL, -- autenticação de senha é feita pelo Firebase
    firebase_uid VARCHAR(128) UNIQUE,
    turma VARCHAR(50),
    foto_perfil VARCHAR(255) DEFAULT 'default.png',
    tipo_usuario ENUM(
        'aluno',
        'usuario',
        'funcionario',
        'admin'
    ) DEFAULT 'usuario',
    consentimento BOOLEAN DEFAULT FALSE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conta fixa da equipe (a senha fica apenas em backend/.env).
INSERT INTO usuarios (nome, email, firebase_uid, tipo_usuario)
VALUES ('Funcionário Jaboatão', 'funcionario@jaboatao', 'funcionario-fixo-local', 'funcionario');


CREATE TABLE conta (
    id_recuperacao INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expiracao DATETIME NOT NULL,
    FOREIGN KEY (id_usuario)
    REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE
);

CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nome_categoria VARCHAR(100) NOT NULL,
     icone VARCHAR(255)

);
CREATE TABLE objetos_perdidos (
    id_objeto INT AUTO_INCREMENT PRIMARY KEY,
    codigo_rastreio VARCHAR(50) UNIQUE,
    nome_objeto VARCHAR(150) NOT NULL,
    descricao TEXT,
    data_encontro DATE NOT NULL,
    local_encontro VARCHAR(255) NOT NULL,
    foto_principal VARCHAR(255), -- nome do arquivo salvo em backend/uploads/
    estado_objeto ENUM(
        'novo',
        'bom',
        'danificado',
        'quebrado'
    ) NOT NULL,

    status_objeto ENUM(
        'perdido',
        'entregue'
    ) DEFAULT 'perdido',

    id_categoria INT,
    id_usuario_cadastro INT,
    id_dono_objeto INT NULL,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_categoria)
    REFERENCES categorias(id_categoria)
    ON DELETE SET NULL,

    FOREIGN KEY (id_usuario_cadastro)
    REFERENCES usuarios(id_usuario)
    ON DELETE SET NULL,

    FOREIGN KEY (id_dono_objeto)
    REFERENCES usuarios(id_usuario)
    ON DELETE SET NULL
);
CREATE TABLE imagens_objetos (
    id_imagem INT AUTO_INCREMENT PRIMARY KEY,
    id_objeto INT NOT NULL,
    caminho_imagem VARCHAR(255) NOT NULL,
    formato ENUM('jpg', 'png') NOT NULL,
    
    FOREIGN KEY (id_objeto)
    REFERENCES objetos_perdidos(id_objeto)
    ON DELETE CASCADE
);


-- Seed das categorias (antes hardcoded no front-end)
INSERT INTO categorias (nome_categoria, icone) VALUES
('Eletrônicos', '📱'),
('Materiais', '📚'),
('Vestuário', '👕'),
('Mochilas', '🎒'),
('Chaves', '🔑'),
('Outros', '•••');


CREATE INDEX idx_nome_objeto
ON objetos_perdidos(nome_objeto);
CREATE INDEX idx_status_objeto
ON objetos_perdidos(status_objeto);
CREATE INDEX idx_categoria
ON objetos_perdidos(id_categoria);
CREATE INDEX idx_local
ON objetos_perdidos(local_encontro);


-- Solicitações feitas por alunos/usuários sobre itens encontrados
CREATE TABLE solicitacoes (
    id_solicitacao INT AUTO_INCREMENT PRIMARY KEY,
    id_objeto INT NOT NULL,
    id_usuario INT NOT NULL,
    mensagem TEXT,
    status ENUM('pendente', 'aprovada', 'recusada') DEFAULT 'pendente',
    data_solicitacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_objeto) REFERENCES objetos_perdidos(id_objeto) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);
