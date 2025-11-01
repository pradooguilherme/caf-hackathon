import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import StatCard from '../components/StatCard.jsx';
import { DASHBOARD_API_BASE_URL } from '../constants.js';

const INITIAL_STATS = {
  abertos: 0,
  fechados: 0,
  tempoMedio: '0',
};

function Statistics() {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data } = await axios.get(`${DASHBOARD_API_BASE_URL}/api/estatisticas`);
      setStats({
        abertos: data?.abertos ?? 0,
        fechados: data?.fechados ?? 0,
        tempoMedio: data?.tempoMedio ?? '0',
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setErrorMessage('Não foi possível carregar as estatísticas.');
      setStats(INITIAL_STATS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <section>
      <header className="flex flex-col gap-3 rounded-3xl bg-bia-50 px-6 py-5 shadow-inner sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-bia-700 sm:text-2xl">Estatísticas Gerais</h2>
          <p className="text-sm text-bia-600">Acompanhe o volume de tickets e o tempo médio de resolução.</p>
        </div>
        <button
          type="button"
          onClick={fetchStats}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-full bg-bia-600 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-bia-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-bia-500 disabled:cursor-not-allowed disabled:bg-bia-300"
        >
          {isLoading ? 'Atualizando...' : 'Recarregar'}
        </button>
      </header>

      {errorMessage && (
        <p className="mt-6 rounded-3xl bg-white px-6 py-4 text-center text-sm font-medium text-bia-700 shadow-md">
          {errorMessage}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Tickets Abertos" value={stats.abertos} color="bg-green-100" />
        <StatCard title="Tickets Fechados" value={stats.fechados} color="bg-red-100" />
        <StatCard title="Tempo Médio (h)" value={stats.tempoMedio} color="bg-blue-100" />
      </div>
    </section>
  );
}

export default Statistics;
