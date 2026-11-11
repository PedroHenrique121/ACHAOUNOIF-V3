const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');

const pastaUploads = path.join(__dirname, '..', 'uploads');

// Garante que a pasta uploads/ exista, senão o multer dá erro ao salvar
if (!fs.existsSync(pastaUploads)) {
    fs.mkdirSync(pastaUploads, { recursive: true });
}

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, pastaUploads);
    },

    filename: (req, file, cb) => {

        const extensao =
            path.extname(file.originalname);

        cb(
            null,
            uuid() + extensao
        );
    }
});

// Aceita apenas imagens
const fileFilter = (req, file, cb) => {

    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Apenas arquivos de imagem são permitidos'));
    }
};

module.exports =
    multer({
        storage,
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 } // 5MB
    });
