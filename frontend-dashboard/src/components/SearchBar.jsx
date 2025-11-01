import PropTypes from 'prop-types';

function SearchBar({ value, onChange, onRefresh, isLoading }) {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <label className="flex flex-1 items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm shadow-md ring-1 ring-bia-100 focus-within:ring-2 focus-within:ring-bia-400 sm:text-base">
        <span className="whitespace-nowrap font-medium text-bia-600">Buscar</span>
        <input
          type="search"
          placeholder="Filtrar por e-mail, produto ou cliente..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-xl border-none bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 sm:text-base"
        />
      </label>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isLoading}
        className="inline-flex items-center justify-center rounded-2xl bg-bia-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-bia-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bia-400 disabled:cursor-not-allowed disabled:bg-bia-300"
      >
        {isLoading ? 'Atualizando...' : 'Atualizar'}
      </button>
    </section>
  );
}

SearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

SearchBar.defaultProps = {
  isLoading: false,
};

export default SearchBar;
