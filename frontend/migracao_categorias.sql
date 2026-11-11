-- Acrescenta as categorias exibidas no protótipo sem remover categorias
-- antigas que possam estar vinculadas a objetos já cadastrados.
INSERT INTO categorias (nome_categoria, icone)
SELECT 'Eletrônicos', '📱'
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome_categoria = 'Eletrônicos');

INSERT INTO categorias (nome_categoria, icone)
SELECT 'Materiais', '📚'
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome_categoria = 'Materiais');

INSERT INTO categorias (nome_categoria, icone)
SELECT 'Vestuário', '👕'
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome_categoria = 'Vestuário');

INSERT INTO categorias (nome_categoria, icone)
SELECT 'Mochilas', '🎒'
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome_categoria = 'Mochilas');

INSERT INTO categorias (nome_categoria, icone)
SELECT 'Chaves', '🔑'
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome_categoria = 'Chaves');

INSERT INTO categorias (nome_categoria, icone)
SELECT 'Outros', '•••'
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome_categoria = 'Outros');
