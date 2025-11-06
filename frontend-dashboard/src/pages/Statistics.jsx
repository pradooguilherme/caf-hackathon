import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import StatCard from '../components/StatCard.jsx';
import { DASHBOARD_API_BASE_URL } from '../constants.js';

const INITIAL_METRICS = {
  total: 0,
  abertos: 0,
  fechados: 0,
  tempoMedio: '0',
};

function Statistics() {
  const [metrics, setMetrics] = useState(INITIAL_METRICS);
  const [dadosPorEstado, setDadosPorEstado] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [ticketsResponse, estadosResponse] = await Promise.all([
        axios.get(`${DASHBOARD_API_BASE_URL}/api/tickets`),
        axios.get(`${DASHBOARD_API_BASE_URL}/api/tickets/por-estado`),
      ]);

      const tickets = Array.isArray(ticketsResponse.data) ? ticketsResponse.data : [];
      const total = tickets.length;
      const abertos = tickets.filter(
        (ticket) => (ticket?.status || 'Aberto').toLowerCase() === 'aberto',
      ).length;
      const fechados = tickets.filter(
        (ticket) => (ticket?.status || '').toLowerCase() === 'fechado',
      ).length;
      const temposValidos = tickets
        .map((ticket) => {
          const tempo = Number(ticket?.tempoEspera);
          return Number.isFinite(tempo) && tempo >= 0 ? tempo : null;
        })
        .filter((tempo) => tempo !== null);
      const tempoMedio = temposValidos.length
        ? (temposValidos.reduce((totalHoras, horas) => totalHoras + horas, 0) / temposValidos.length).toFixed(1)
        : '0';

      setMetrics({
        total,
        abertos,
        fechados,
        tempoMedio,
      });

      const agrupados = estadosResponse?.data ?? {};
      const dataset = Object.entries(agrupados).map(([estado, quantidade]) => ({
        estado,
        quantidade,
      }));
      dataset.sort((a, b) => b.quantidade - a.quantidade);
      setDadosPorEstado(dataset);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setErrorMessage('Não foi possível carregar as estatísticas no momento.');
      setMetrics(INITIAL_METRICS);
      setDadosPorEstado([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <section>
      <header className="flex flex-col gap-3 rounded-3xl bg-red-100 px-6 py-5 shadow-inner sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-red-700 sm:text-2xl">Estatísticas Gerais</h2>
          <p className="text-sm text-red-600">Acompanhe o volume de tickets e o tempo médio de resolução.</p>
        </div>
        <button
          type="button"
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:bg-red-300"
        >
          {isLoading ? 'Atualizando...' : 'Recarregar'}
        </button>
      </header>

      {errorMessage && (
        <p className="mt-6 rounded-3xl bg-white px-6 py-4 text-center text-sm font-medium text-red-700 shadow-md">
          {errorMessage}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total de Tickets" value={metrics.total} color="bg-white" />
        <StatCard title="Tickets Abertos" value={metrics.abertos} color="bg-red-100" />
        <StatCard title="Tickets Fechados" value={metrics.fechados} color="bg-red-100" />
        <StatCard title="Tempo Médio (h)" value={`${metrics.tempoMedio} h`} color="bg-white" />
      </div>

      <section className="mt-10 rounded-3xl bg-white p-6 shadow-md ring-1 ring-red-100">
        <h3 className="text-lg font-semibold text-red-700">Tickets por estado</h3>
        <p className="text-sm text-red-600">A distribuição geográfica ajuda a priorizar recursos de suporte.</p>

        <div className="mt-6 h-72 w-full">
          {dadosPorEstado.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-2xl bg-red-50 text-sm font-medium text-red-700">
              {isLoading ? 'Carregando gráfico...' : 'Nenhum ticket com estado informado até o momento.'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosPorEstado}>
                <CartesianGrid strokeDasharray="3 3" stroke="#fecaca" />
                <XAxis dataKey="estado" stroke="#b91c1c" />
                <YAxis allowDecimals={false} stroke="#b91c1c" />
                <Tooltip cursor={{ fill: 'rgba(248, 113, 113, 0.15)' }} />
                <Bar dataKey="quantidade" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </section>
  );
}

export default Statistics;
