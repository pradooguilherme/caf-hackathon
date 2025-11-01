import PropTypes from 'prop-types';

const NAV_ITEMS = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'statistics', label: 'Estatísticas' },
];

function NavBar({ activeTab, onSelect }) {
  return (
    <nav className="rounded-3xl bg-bia-600 p-2 text-sm font-semibold text-white shadow-md sm:text-base">
      <ul className="flex flex-wrap gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeTab;
          const baseClasses = 'flex-1 min-w-[140px] rounded-2xl px-4 py-2 text-center transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';
          const activeClasses = isActive ? 'bg-bia-700 text-white shadow-inner' : 'bg-bia-500/40 text-white hover:bg-bia-500';

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
