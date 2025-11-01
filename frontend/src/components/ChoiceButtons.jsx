import PropTypes from 'prop-types';

function ChoiceButtons({ options, onSelect, disabled }) {
  if (!options?.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3 px-5 pb-5">
      {options.map((option) => {
        const label =
          option === 'Acionar garantia'
            ? '💬 Acionar garantia'
            : option === 'Registrar produto comprado'
              ? '🧾 Registrar produto comprado'
              : option === 'Entrar em contato'
                ? '☎️ Entrar em contato'
                : option;

        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-bia-button transition-all duration-300 ease-out hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:bg-red-200 disabled:text-red-50"
            onClick={() => onSelect(option)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

ChoiceButtons.propTypes = {
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

ChoiceButtons.defaultProps = {
  disabled: false,
};

export default ChoiceButtons;
