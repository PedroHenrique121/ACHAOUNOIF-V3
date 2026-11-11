require('dotenv').config();

const mysql = require('mysql2');

// Pool em vez de uma conexão única: a conexão única do PP3 morre quando o
// MySQL derruba conexões ociosas e o servidor passa a falhar até reiniciar.
// O pool reabre conexões sozinho e mantém a mesma API (db.query(sql, valores, callback)).
const opcoes = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
};

if (process.env.DB_SSL === 'true') {
    opcoes.ssl = { rejectUnauthorized: false };
}

const conexao = mysql.createPool(opcoes);

// Teste de conexão ao subir o servidor, para o erro aparecer logo no terminal
conexao.getConnection((erro, con) => {

    if (erro) {
        console.error(
            'Erro ao conectar ao MySQL (' + (erro.code || 'sem código') + '): ' + erro.message + '\n' +
            '   Confira DB_HOST, DB_PORT, DB_USER, DB_PASSWORD e DB_NAME no backend/.env\n' +
            '   e se o banco "' + process.env.DB_NAME + '" existe (rode o bancoPP3.sql).'
        );
        return;
    }

    console.log('MySQL conectado em ' + opcoes.host + ':' + opcoes.port + '/' + opcoes.database);
    con.release();
});

module.exports = conexao;
