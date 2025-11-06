import PropTypes from 'prop-types';

const formatDate = (value) => {
  if (!value) {
    return '--';
  }

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '--';
  }
};

function TicketTable({ tickets, isLoading, error, onViewDetails }) {
  const hasTickets = tickets.length > 0;

  return (
    <section className="mt-8 rounded-3xl bg-white p-4 shadow-md ring-1 ring-red-100 sm:p-6">
      {error ? (
        <p className="rounded-2xl bg-red-100 px-5 py-6 text-center text-sm font-medium text-red-700 shadow-inner">
          {error}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed border-collapse text-sm text-gray-700 sm:text-base">
            <thead>
              <tr className="bg-red-600 text-left text-xs font-semibold uppercase tracking-wide text-white sm:text-sm">
                <th scope="col" className="w-28 rounded-l-2xl px-4 py-4">ID</th>
                <th scope="col" className="w-44 px-4 py-4">Cliente</th>
                <th scope="col" className="w-48 px-4 py-4">Produto</th>
                <th scope="col" className="w-40 px-4 py-4">Cidade</th>
                <th scope="col" className="w-32 px-4 py-4">Estado</th>
                <th scope="col" className="w-32 px-4 py-4">Status</th>
                <th scope="col" className="w-48 px-4 py-4">Data</th>
                <th scope="col" className="w-36 rounded-r-2xl px-4 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-red-700">
                    Carregando tickets...
                  </td>
                </tr>
              )}

              {!isLoading && !hasTickets && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-red-700">
                    Nenhum ticket registrado até o momento.
                  </td>
                </tr>
              )}

              {!isLoading &&
                hasTickets &&
                tickets.map((ticket, index) => {
                  const rowStyle = index % 2 === 0 ? 'bg-red-50' : 'bg-white';

                  return (
                    <tr key={ticket.id} className={`${rowStyle} text-xs sm:text-sm`}>
                      <td className="px-4 py-4 font-semibold text-red-700 sm:text-base">{ticket.id}</td>
                      <td className="px-4 py-4">{ticket.nome || '--'}</td>
                      <td className="px-4 py-4">{ticket.produto || '--'}</td>
                      <td className="px-4 py-4">{ticket.cidade || '--'}</td>
                      <td className="px-4 py-4">{ticket.estado || '--'}</td>
                      <td className="px-4 py-4">{ticket.status || 'Aberto'}</td>
                      <td className="px-4 py-4 text-sm sm:text-base">
                        {formatDate(ticket.dataCriacao || ticket.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => onViewDetails(ticket.id)}
                          className="inline-flex items-center justify-center rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 sm:text-sm"
                        >
                          Ver detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

TicketTable.propTypes = {
  tickets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      nome: PropTypes.string,
      email: PropTypes.string,
      produto: PropTypes.string,
      problema: PropTypes.string,
      dataCriacao: PropTypes.string,
      createdAt: PropTypes.string,
      cidade: PropTypes.string,
      estado: PropTypes.string,
      status: PropTypes.string,
    }),
  ),
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onViewDetails: PropTypes.func,
};

TicketTable.defaultProps = {
  tickets: [],
  isLoading: false,
  error: '',
  onViewDetails: () => {},
};

export default TicketTable;
