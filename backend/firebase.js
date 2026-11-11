const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const caminhoChave = path.join(__dirname, 'serviceAccountKey.json');

let appInicializado = null;

function carregarCredencial() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    }
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        return {
            project_id: process.env.FIREBASE_PROJECT_ID,
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        };
    }
    if (fs.existsSync(caminhoChave)) return require(caminhoChave);
    return null;
}

const serviceAccount = carregarCredencial();
if (serviceAccount) {

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    appInicializado = admin;

} else {

    console.warn(
        '⚠️  AVISO: credenciais Firebase Admin não configuradas.\n' +
        '   O login/autenticação (Firebase) não vai funcionar até você adicionar esse arquivo.\n' +
        '   Configure FIREBASE_SERVICE_ACCOUNT_JSON, as variáveis FIREBASE_* ou backend/serviceAccountKey.json.'
    );
}

module.exports = appInicializado;
