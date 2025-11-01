import PropTypes from 'prop-types';
import { useCallback } from 'react';

function InputArea({ value, onChange, onSubmit, disabled, placeholder }) {
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (!disabled && value.trim()) {
          onSubmit();
        }
      }
    },
    [disabled, onSubmit, value],
  );

  return (
    <div className="border-t border-red-100 bg-white/90 px-5 py-4 backdrop-blur">
      <div className="flex items-end gap-3 rounded-3xl border border-red-100 bg-white px-4 py-3 shadow-inner">
        <textarea
          className="h-12 flex-1 resize-none border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white transition-all duration-300 ease-out hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:bg-red-200"
          aria-label="Enviar mensagem"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M3.4 5.3 19.8 12 3.4 18.7l3-6.7-3-6.7zM6.4 12H12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

InputArea.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
};

InputArea.defaultProps = {
  disabled: true,
  placeholder: 'Digite sua resposta...',
};

export default InputArea;
