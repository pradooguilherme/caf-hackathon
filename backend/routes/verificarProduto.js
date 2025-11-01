const fs = require('fs');
const path = require('path');
const express = require('express');
const crypto = require('crypto');

const router = express.Router();

const REGISTRATION_FILE = path.join(__dirname, '..', 'produtos_registrados.json');

function hash(value) {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

router.post('/api/verificar-produto', (req, res) => {
  try {
    const { email, notaFiscal } = req.body || {};

    if (!email || !notaFiscal) {
      return res.status(400).json({
        found: false,
        message: 'Dados insuficientes para verificar o produto.',
      });
    }

    const emailHash = hash(email);
    const notaFiscalHash = hash(notaFiscal);

    if (!fs.existsSync(REGISTRATION_FILE)) {
      return res.status(200).json({ found: false });
    }

    let registrosRaw = [];
    try {
      const raw = fs.readFileSync(REGISTRATION_FILE, 'utf-8');
      registrosRaw = raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error('Erro ao ler o arquivo de produtos registrados:', error);
      return res.status(500).json({ found: false, message: 'Erro ao verificar produto.' });
    }

    let shouldPersistUpdates = false;
    let encontrado = null;

    const registrosAtualizados = registrosRaw.map((registro) => {
      const hasHashed = registro.emailHash && registro.notaFiscalHash;
      let registroEmailHash = registro.emailHash;
      let registroNotaHash = registro.notaFiscalHash;

      if (!hasHashed && (registro.email || registro.notaFiscal)) {
        if (registro.email) {
          registroEmailHash = hash(registro.email);
        }
        if (registro.notaFiscal) {
          registroNotaHash = hash(registro.notaFiscal);
        }
        shouldPersistUpdates = true;
        delete registro.email;
        delete registro.notaFiscal;
      }

      if (!registroEmailHash || !registroNotaHash) {
        return {
          ...registro,
          emailHash: registroEmailHash,
          notaFiscalHash: registroNotaHash,
        };
      }

      if (!encontrado && registroEmailHash === emailHash && registroNotaHash === notaFiscalHash) {
        encontrado = registro;
      }

      return {
        ...registro,
        emailHash: registroEmailHash,
        notaFiscalHash: registroNotaHash,
      };
    });

    if (shouldPersistUpdates) {
      try {
        fs.writeFileSync(REGISTRATION_FILE, JSON.stringify(registrosAtualizados, null, 2));
      } catch (error) {
        console.error('Erro ao atualizar hashes de produtos registrados:', error);
      }
    }

    if (encontrado) {
      return res.status(200).json({
        found: true,
        produto: encontrado.produto || null,
        nome: encontrado.nome || null,
      });
    }

    return res.status(200).json({ found: false });
  } catch (error) {
    console.error('Erro inesperado ao verificar produto:', error);
    return res.status(500).json({ found: false, message: 'Erro ao verificar produto.' });
  }
});

module.exports = router;
