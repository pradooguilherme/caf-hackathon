const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, 'tickets.json');
const REGISTRATION_FILE = path.join(__dirname, 'produtos_registrados.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const verificarProdutoRouter = require('./routes/verificarProduto');

const hash = (value) => crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({ storage });

app.use('/uploads', express.static(UPLOAD_DIR));
app.use(verificarProdutoRouter);

/**
 * Loads the existing tickets from disk if the file exists,
 * otherwise returns an empty array.
 */
function loadTickets() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

/**
 * Persists the provided tickets array to disk, creating the file
 * if necessary.
 */
function saveTickets(tickets) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tickets, null, 2));
}

// expose tickets for dashboard consumption
app.get('/api/tickets', (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return res.json([]);
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8') || '[]';
    const parsed = JSON.parse(raw);
    return res.json(parsed);
  } catch (error) {
    console.error('Erro ao ler tickets.json:', error);
    return res.status(500).json({ error: 'Erro ao ler tickets.json' });
  }
});

app.post('/api/ticket', upload.single('attachment'), (req, res) => {
  const payload = req.body || {};
  const normalizedName = payload.name || payload.nome;
  const normalizedProduct = payload.productName || payload.produto;
  const normalizedIssue = payload.issueDescription || payload.problema;
  const normalizedState = payload.estado;
  const normalizedCity = payload.cidade;
  const requiredFields = [normalizedName, payload.email, normalizedProduct, normalizedIssue, normalizedState, normalizedCity];

  const hasAllFields = requiredFields.every((field) => typeof field === 'string' && field.trim() !== '');

  if (!hasAllFields) {
    return res.status(400).json({
      success: false,
      message: 'Dados incompletos. Verifique as informações enviadas.',
    });
  }

  const tickets = loadTickets();
  const ticketId = `TCK-${String(tickets.length + 1).padStart(4, '0')}`;
  const attachmentFilename = req.file ? req.file.filename : null;
  const estado = normalizedState.trim().toUpperCase();
  const cidade = normalizedCity.trim();
  const email = (payload.email || '').trim();
  const newTicket = {
    id: ticketId,
    nome: normalizedName.trim(),
    email,
    produto: normalizedProduct.trim(),
    problema: normalizedIssue.trim(),
    estado,
    cidade,
    status: 'Aberto',
    dataCriacao: new Date().toISOString(),
    tempoEspera: null,
    wantsImage: payload.wantsImage === 'true' ? true : payload.wantsImage === 'false' ? false : payload.wantsImage,
  };

  if (attachmentFilename) {
    newTicket.anexo = `/uploads/${attachmentFilename}`;
  }

  tickets.push(newTicket);

  try {
    saveTickets(tickets);
  } catch (error) {
    console.error('Erro ao salvar ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Não foi possível salvar o ticket no momento.',
    });
  }

  return res.status(200).json({
    success: true,
    ticketId,
    attachment: attachmentFilename ? `/uploads/${attachmentFilename}` : null,
  });
});

app.post('/api/registro-produto', (req, res) => {
  try {
    const payload = req.body || {};
    const requiredFields = [payload.nome, payload.email, payload.produto, payload.dataCompra, payload.notaFiscal];
    const hasAllRegistrationFields = requiredFields.every((field) => typeof field === 'string' && field.trim() !== '');

    if (!hasAllRegistrationFields) {
      return res.status(400).json({
        success: false,
        message: 'Dados incompletos. Verifique as informações enviadas.',
      });
    }

    const emailHash = hash(payload.email);
    const notaFiscalHash = hash(payload.notaFiscal);

    let registros = [];
    let shouldPersistUpdates = false;

    if (fs.existsSync(REGISTRATION_FILE)) {
      try {
        const raw = fs.readFileSync(REGISTRATION_FILE, 'utf-8');
        registros = raw ? JSON.parse(raw) : [];
      } catch (readError) {
        console.error('Erro ao ler registros de produto:', readError);
        registros = [];
      }
    }

    registros = registros.map((registro) => {
      if (registro.emailHash && registro.notaFiscalHash) {
        return registro;
      }

      const updated = {
        ...registro,
        emailHash: registro.emailHash || (registro.email ? hash(registro.email) : undefined),
        notaFiscalHash: registro.notaFiscalHash || (registro.notaFiscal ? hash(registro.notaFiscal) : undefined),
      };

      if (registro.email || registro.notaFiscal || !registro.emailHash || !registro.notaFiscalHash) {
        shouldPersistUpdates = true;
      }

      delete updated.email;
      delete updated.notaFiscal;

      return updated;
    });

    registros.push({
      nome: payload.nome.trim(),
      produto: payload.produto.trim(),
      dataCompra: payload.dataCompra.trim(),
      emailHash,
      notaFiscalHash,
      dataRegistro: new Date().toISOString(),
    });

    if (!shouldPersistUpdates) {
      shouldPersistUpdates = true;
    }

    if (shouldPersistUpdates) {
      fs.writeFileSync(REGISTRATION_FILE, JSON.stringify(registros, null, 2));
    }

    return res.status(200).json({ success: true, message: 'Produto registrado com sucesso.' });
  } catch (error) {
    console.error('Erro ao registrar produto:', error);
    return res.status(500).json({ success: false, message: 'Erro ao registrar produto.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor de tickets rodando em http://localhost:${PORT}`);
});
