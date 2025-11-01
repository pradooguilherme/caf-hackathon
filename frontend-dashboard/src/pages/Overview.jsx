import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import TicketTable from '../components/TicketTable.jsx';
import { DASHBOARD_API_BASE_URL } from '../constants.js';

function Overview() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [closingTicketId, setClosingTicketId] = useState('');

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data } = await axios.get(`${DASHBOARD_API_BASE_URL}/api/tickets`);
      setTickets(Array.isArray(data) ? data : []);
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

  const handleCloseTicket = useCallback(
    async (ticketId) => {
      if (!ticketId) {
        return;
      }

      setClosingTicketId(ticketId);
      setErrorMessage('');

      try {
        await axios.post(`${DASHBOARD_API_BASE_URL}/api/fechar-ticket`, { id: ticketId });
        await fetchTickets();
      } catch (error) {
        console.error('Erro ao fechar ticket:', error);
        setErrorMessage('Não foi possível fechar o ticket. Tente novamente.');
      } finally {
        setClosingTicketId('');
      }
    },
    [fetchTickets],
  );

  return (
    <section>
      <header className="flex flex-col gap-3 rounded-3xl bg-bia-50 px-6 py-5 shadow-inner sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-bia-700 sm:text-2xl">Visão Geral dos Tickets</h2>
          <p className="text-sm text-bia-600">Gerencie os chamados abertos do Assistente Virtual Bia.</p>
        </div>
        <button
          type="button"
          onClick={fetchTickets}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-full bg-bia-600 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-bia-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-bia-500 disabled:cursor-not-allowed disabled:bg-bia-300"
        >
          {isLoading ? 'Atualizando...' : 'Atualizar lista'}
        </button>
      </header>

      <TicketTable
        tickets={tickets}
        isLoading={isLoading}
        error={errorMessage}
        onCloseTicket={handleCloseTicket}
        closingTicketId={closingTicketId}
      />
    </section>
  );
}

export default Overview;
