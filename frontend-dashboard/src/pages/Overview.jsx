import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import TicketTable from '../components/TicketTable.jsx';
import TicketDetail from './TicketDetail.jsx';
import { DASHBOARD_API_BASE_URL } from '../constants.js';

function Overview() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState('');

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data } = await axios.get(`${DASHBOARD_API_BASE_URL}/api/tickets`);
      const safeData = Array.isArray(data) ? [...data] : [];
      safeData.sort((a, b) => {
        const first = new Date(b?.dataCriacao || b?.createdAt || 0).getTime();
        const second = new Date(a?.dataCriacao || a?.createdAt || 0).getTime();
        return first - second;
      });
      setTickets(safeData);
    } catch (error) {
      console.error('Erro ao carregar tickets:', error);
      setErrorMessage('Não foi possível carregar os tickets. Tente novamente em instantes.');
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleViewDetails = useCallback((ticketId) => {
    setSelectedTicketId(ticketId);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedTicketId('');
  }, []);

  const handleTicketUpdated = useCallback(async () => {
    await fetchTickets();
  }, [fetchTickets]);

  const hasDetailOpen = useMemo(() => Boolean(selectedTicketId), [selectedTicketId]);

  return (
    <section className="relative">
      <header className="flex flex-col gap-3 rounded-3xl bg-red-100 px-6 py-5 shadow-inner sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-red-700 sm:text-2xl">Visão Geral dos Tickets</h2>
          <p className="text-sm text-red-600">Gerencie os chamados abertos do Assistente Virtual Bia.</p>
        </div>
        <button
          type="button"
          onClick={fetchTickets}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:bg-red-300"
        >
          {isLoading ? 'Atualizando...' : 'Atualizar lista'}
        </button>
      </header>

      <TicketTable tickets={tickets} isLoading={isLoading} error={errorMessage} onViewDetails={handleViewDetails} />

      {hasDetailOpen && (
        <TicketDetail ticketId={selectedTicketId} onClose={handleCloseDetails} onUpdated={handleTicketUpdated} />
      )}
    </section>
  );
}

export default Overview;
