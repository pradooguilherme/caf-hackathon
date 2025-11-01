import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5001;
const OPEN_TICKETS_PATH = path.resolve(__dirname, '../backend/tickets.json');
const CLOSED_TICKETS_PATH = path.resolve(__dirname, 'tickets-fechados.json');

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Safely reads a JSON file, returning a fallback value if the file is missing
 * or contains invalid JSON.
 */
function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) {
      return Array.isArray(fallback) ? [...fallback] : fallback;
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) {
      return Array.isArray(fallback) ? [...fallback] : fallback;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error(`Não foi possível ler ${filePath}:`, error);
    return Array.isArray(fallback) ? [...fallback] : fallback;
  }
}

/**
 * Persists a JSON serializable object to disk with formatting for readability.
 */
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/** Garante que o arquivo de tickets fechados exista. */
if (!fs.existsSync(CLOSED_TICKETS_PATH)) {
  writeJson(CLOSED_TICKETS_PATH, []);
}

app.get('/api/tickets', (req, res) => {
  const tickets = readJson(OPEN_TICKETS_PATH, []);
  res.json(tickets);
});

app.post('/api/fechar-ticket', (req, res) => {
  const { id } = req.body || {};

  if (!id) {
    return res.status(400).json({ success: false, message: 'ID do ticket é obrigatório.' });
  }

  const openTickets = readJson(OPEN_TICKETS_PATH, []);
  const closedTickets = readJson(CLOSED_TICKETS_PATH, []);
  const ticketIndex = openTickets.findIndex((ticket) => ticket.id === id);

  if (ticketIndex === -1) {
    return res.status(404).json({ success: false, message: 'Ticket não encontrado.' });
  }

  const [ticket] = openTickets.splice(ticketIndex, 1);
  const dataCriacao = ticket.dataCriacao || ticket.createdAt || new Date().toISOString();
  const closedTicket = {
    ...ticket,
    dataCriacao,
    dataFechamento: new Date().toISOString(),
  };
  closedTickets.push(closedTicket);

  try {
    writeJson(OPEN_TICKETS_PATH, openTickets);
    writeJson(CLOSED_TICKETS_PATH, closedTickets);
    return res.status(200).json({ success: true, ticket: closedTicket });
  } catch (error) {
    console.error('Erro ao persistir atualização de tickets:', error);
    return res.status(500).json({ success: false, message: 'Erro ao fechar ticket.' });
  }
});

app.get('/api/estatisticas', (req, res) => {
  try {
    const openTickets = readJson(OPEN_TICKETS_PATH, []);
    const closedTickets = readJson(CLOSED_TICKETS_PATH, []);

    const durations = closedTickets
      .map((ticket) => {
        const dataCriacao = ticket?.dataCriacao || ticket?.createdAt;
        if (!dataCriacao || !ticket?.dataFechamento) {
          return null;
        }

        const start = new Date(dataCriacao);
        const end = new Date(ticket.dataFechamento);
        const diffInMs = end.getTime() - start.getTime();

        if (Number.isNaN(diffInMs) || diffInMs < 0) {
          return null;
        }

        return diffInMs / (1000 * 60 * 60);
      })
      .filter((value) => typeof value === 'number');

    const averageDuration = durations.length
      ? (durations.reduce((acc, value) => acc + value, 0) / durations.length).toFixed(2)
      : '0';

    return res.json({
      abertos: openTickets.length,
      fechados: closedTickets.length,
      tempoMedio: averageDuration,
    });
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    return res.status(500).json({ message: 'Erro ao calcular estatísticas.' });
  }
});

app.listen(PORT, () => {
  console.log(`Dashboard backend rodando em http://localhost:${PORT}`);
});
