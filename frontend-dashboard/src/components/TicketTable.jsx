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

function TicketTable({ tickets, isLoading, error, onCloseTicket, closingTicketId }) {
  const hasTickets = tickets.length > 0;

  return (
    <section className="mt-8 rounded-3xl bg-white p-4 shadow-md ring-1 ring-bia-100 sm:p-6">
      {error ? (
        <p className="rounded-2xl bg-bia-50 px-5 py-6 text-center text-sm font-medium text-bia-700 shadow-inner">
          {error}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed border-collapse text-sm text-gray-700 sm:text-base">
            <thead>
              <tr className="bg-bia-600 text-left text-xs font-semibold uppercase tracking-wide text-white sm:text-sm">
                <th scope="col" className="w-28 rounded-l-2xl px-4 py-4">ID</th>
                <th scope="col" className="w-40 px-4 py-4">Cliente</th>
                <th scope="col" className="w-48 px-4 py-4">E-mail</th>
                <th scope="col" className="w-40 px-4 py-4">Produto</th>
                <th scope="col" className="w-[22rem] px-4 py-4">Problema</th>
                <th scope="col" className="w-44 px-4 py-4">Data de criação</th>
                <th scope="col" className="w-40 rounded-r-2xl px-4 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-bia-700">
                    Carregando tickets...
                  </td>
                </tr>
              )}

              {!isLoading && !hasTickets && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-bia-700">
                    Nenhum ticket registrado até o momento.
                  </td>
                </tr>
              )}

              {!isLoading &&
                hasTickets &&
                tickets.map((ticket, index) => {
                  const rowStyle = index % 2 === 0 ? 'bg-bia-50' : 'bg-white';
                  const isClosing = closingTicketId === ticket.id;

                  return (
                    <tr key={ticket.id} className={`${rowStyle} text-xs sm:text-sm`}>
                      <td className="px-4 py-4 font-semibold text-bia-700 sm:text-base">{ticket.id}</td>
                      <td className="px-4 py-4">{ticket.name || '--'}</td>
                      <td className="px-4 py-4 break-words">{ticket.email || '--'}</td>
                      <td className="px-4 py-4">{ticket.productName || '--'}</td>
                      <td className="px-4 py-4">{ticket.issueDescription || '--'}</td>
                      <td className="px-4 py-4 text-sm sm:text-base">
                        {formatDate(ticket.dataCriacao || ticket.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => onCloseTicket(ticket.id)}
                          disabled={isClosing}
                          className="inline-flex items-center justify-center rounded-full bg-bia-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-bia-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-bia-500 disabled:cursor-not-allowed disabled:bg-bia-300 sm:text-sm"
                        >
                          {isClosing ? 'Fechando...' : 'Fechar ticket'}
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
      name: PropTypes.string,
      email: PropTypes.string,
      productName: PropTypes.string,
      issueDescription: PropTypes.string,
      createdAt: PropTypes.string,
      dataCriacao: PropTypes.string,
    }),
  ),
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onCloseTicket: PropTypes.func,
  closingTicketId: PropTypes.string,
};

TicketTable.defaultProps = {
  tickets: [],
  isLoading: false,
  error: '',
  onCloseTicket: () => {},
  closingTicketId: '',
};

export default TicketTable;
