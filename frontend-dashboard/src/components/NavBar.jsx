import PropTypes from 'prop-types';

const NAV_ITEMS = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'statistics', label: 'Estatísticas' },
];

function NavBar({ activeTab, onSelect }) {
  return (
    <nav className="rounded-2xl bg-red-100 p-2 text-sm font-semibold text-red-800 shadow-inner sm:text-base">
      <ul className="flex flex-wrap gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeTab;
          const baseClasses =
            'w-full rounded-lg px-4 py-2 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500';
          const activeClasses = isActive
            ? 'bg-red-600 text-white shadow-md'
            : 'bg-red-100 text-red-800 hover:bg-red-200';

          return (
            <li key={item.id} className="flex-1">
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`${baseClasses} ${activeClasses}`}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

NavBar.propTypes = {
  activeTab: PropTypes.oneOf(['overview', 'statistics']).isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default NavBar;
