# CAF Hackathon Web App

Assistente virtual full-stack criado para o hackathon da CAF. O projeto entrega:

- Chatbot com interface React para abertura de tickets de suporte.
- API em Node/Express que registra tickets, armazena anexos e valida produtos.
- Dashboard analítico (frontend + backend próprios) para acompanhar tickets em tempo real.

## Visão geral da arquitetura

| Diretório | Papel | Porta(s) padrão |
|-----------|-------|------------------|
| `frontend/` | SPA (Vite + React) responsável pelo fluxo conversacional da assistente Bia. | 5173 |
| `backend/` | API REST que recebe tickets, realiza upload de arquivos e registra/verifica produtos. | 4000 |
| `frontend-dashboard/` | Painel administrativo em React com gráficos (Recharts). | 5174 |
| `backend-dashboard/` | API de apoio ao painel: agrega tickets e calcula métricas. | 5001 |

> Todos os serviços persistem dados em arquivos JSON dentro do repositório, simplificando o uso local sem necessidade de banco de dados.

## Como começar

### 1. Instalação rápida

```bash
npm install          # instala dependências da raiz
npm run install:all  # instala frontend e backend
```

### 2. Serviços

```bash
# Frontend (chatbot)
cd frontend
npm install
npm run dev

# Backend (tickets + registro de produtos)
cd backend
npm install
npm run start

# Dashboard frontend
cd frontend-dashboard
npm install
npm run dev

# Dashboard backend
cd backend-dashboard
npm install
npm run start
```

## APIs principais

### Backend (`/backend`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/tickets` | Lista todos os tickets registrados (usado pelo dashboard e chatbot). |
| `POST` | `/api/ticket` | Cria um ticket de suporte (aceita upload via campo `attachment`). |
| `POST` | `/api/registro-produto` | Registra produtos e armazena hashes de e-mail/nota fiscal. |
| `POST` | `/api/verificar-produto` | Verifica se um produto já foi registrado com e-mail + nota fiscal. |

Arquivos gerados: `backend/tickets.json`, `backend/uploads/*`, `backend/produtos_registrados.json`.

### Backend do dashboard (`/backend-dashboard`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/tickets` | Lê tickets abertos do backend principal. |
| `GET` | `/api/ticket/:id` | Retorna detalhes de um ticket. |
| `PUT` | `/api/ticket/:id` | Atualiza status e tempo de espera. |
| `POST` | `/api/fechar-ticket` | Move ticket para `tickets-fechados.json`. |
| `GET` | `/api/tickets/por-estado` | Mapa de calor por UF. |
| `GET` | `/api/estatisticas` | Totais de tickets abertos/fechados e SLA médio. |

## Estrutura de pastas (resumo)
```
.
├── backend/               # API principal (Express, Multer, persistência em arquivos)
├── backend-dashboard/     # API auxiliar do painel administrativo
├── frontend/              # Chatbot da assistente Bia (React + Vite + Tailwind)
├── frontend-dashboard/    # Painel de monitoramento (React + Recharts)
└── assets/                # Recursos compartilhados (logos, mockups etc.)
```
