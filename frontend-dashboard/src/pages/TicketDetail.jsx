import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { DASHBOARD_API_BASE_URL } from '../constants.js';

const STATUS_OPTIONS = ['Aberto', 'Fechado', 'Em Análise'];

const formatDateTime = (value) => {
  if (!value) {
    return '--';
  }

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    console.error('Não foi possível formatar a data:', error);
    return '--';
  }
};

function TicketDetail({ ticketId, onClose, onUpdated }) {
  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState('Aberto');
  const [tempoEspera, setTempoEspera] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const fetchTicket = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data } = await axios.get(`${DASHBOARD_API_BASE_URL}/api/ticket/${ticketId}`);
      setTicket(data);
      setStatus(data?.status || 'Aberto');
      const tempo = data?.tempoEspera;
      setTempoEspera(tempo === null || tempo === undefined ? '' : String(tempo));
    } catch (error) {
      console.error('Erro ao carregar detalhes do ticket:', error);
      setErrorMessage('Não foi possível carregar os detalhes do ticket.');
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId, fetchTicket]);

  const handleSave = useCallback(async () => {
    if (!ticketId) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    const payload = {};
    if (status) {
      payload.status = status;
    }
    if (tempoEspera !== '') {
      const parsedTempo = Number(tempoEspera);
      if (Number.isNaN(parsedTempo) || parsedTempo < 0) {
        setErrorMessage('Informe um tempo de espera válido (número maior ou igual a zero).');
        setIsSaving(false);
        return;
      }
      payload.tempoEspera = parsedTempo;
    }

    try {
      const response = await axios.put(`${DASHBOARD_API_BASE_URL}/api/ticket/${ticketId}`, payload);
      const updatedTicket =
        response?.data?.ticket !== undefined
          ? response.data.ticket
          : {
              ...(ticket || {}),
              status: payload.status ?? ticket?.status,
              tempoEspera:
                payload.tempoEspera !== undefined ? payload.tempoEspera : ticket?.tempoEspera,
            };
      setToastMessage('Alterações salvas com sucesso!');
      setTicket(updatedTicket);
      if (updatedTicket?.tempoEspera === null || updatedTicket?.tempoEspera === undefined) {
        setTempoEspera('');
      } else {
        setTempoEspera(String(updatedTicket.tempoEspera));
      }
      if (onUpdated) {
        onUpdated();
      }
      setTimeout(() => setToastMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar ticket:', error);
      setErrorMessage('Não foi possível salvar as alterações. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }, [ticketId, status, tempoEspera, ticket, onUpdated]);

  const handleTempoChange = useCallback((event) => {
    setTempoEspera(event.target.value);
  }, []);

  const formattedCreatedAt = useMemo(() => formatDateTime(ticket?.dataCriacao || ticket?.createdAt), [ticket]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Ticket</p>
            <h3 className="text-2xl font-bold text-gray-900">{ticket?.id ?? ticketId}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            Voltar para a lista
          </button>
        </header>

        {toastMessage && (
          <div className="mt-4 rounded-xl bg-green-100 px-4 py-3 text-sm font-medium text-green-800 shadow-inner">
            {toastMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-sm font-medium text-red-700 shadow-inner">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="mt-6 animate-pulse space-y-4">
            <div className="h-5 rounded bg-red-100" />
            <div className="h-5 rounded bg-red-100" />
            <div className="h-5 rounded bg-red-100" />
            <div className="h-32 rounded-2xl bg-red-100" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Cliente</p>
                <p className="text-base font-medium text-gray-900">{ticket?.nome || '--'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-500">E-mail</p>
                <p className="text-base text-gray-700">{ticket?.email || '--'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Produto</p>
                <p className="text-base text-gray-900">{ticket?.produto || '--'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Problema</p>
                <p className="text-base text-gray-900">{ticket?.problema || '--'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Estado</p>
                <p className="text-base text-gray-900">{ticket?.estado || '--'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Cidade</p>
                <p className="text-base text-gray-900">{ticket?.cidade || '--'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Data de criação</p>
                <p className="text-base text-gray-900">{formattedCreatedAt}</p>
              </div>
              {ticket?.anexo && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-500">Anexo enviado</p>
                  <a
                    className="text-base font-medium text-red-600 underline hover:text-red-700"
                    href={ticket.anexo}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Visualizar arquivo
                  </a>
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-red-50 px-5 py-5 shadow-inner">
              <h4 className="text-lg font-semibold text-red-700">Atualizar ticket</h4>
              <p className="text-sm text-red-600">Ajuste o status ou informe o tempo de espera médio para este ticket.</p>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-semibold text-gray-800">
                  Status
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-gray-900 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-sm font-semibold text-gray-800">
                  Tempo de espera (horas)
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={tempoEspera}
                    onChange={handleTempoChange}
                    placeholder="Ex: 12"
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-gray-900 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  {isSaving ? 'Salvando...' : 'Salvar alterações'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-gray-700 transition hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

TicketDetail.propTypes = {
  ticketId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdated: PropTypes.func,
};

TicketDetail.defaultProps = {
  onUpdated: null,
};

export default TicketDetail;
