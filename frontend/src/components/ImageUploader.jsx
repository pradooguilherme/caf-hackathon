import PropTypes from 'prop-types';

function ImageUploader({ onFileSelect, onSkip, disabled, error }) {
  return (
    <div className="space-y-3 border-t border-red-100 bg-red-50/70 px-5 py-4 text-sm text-slate-600">
      <p>Anexe uma imagem (PNG ou JPG) de até 5 MB para nos ajudar a entender o problema.</p>
      <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-red-400/70 bg-white px-5 py-6 text-center transition-all duration-300 ease-in-out hover:border-red-500/70 hover:bg-red-50">
        <span className="text-sm font-semibold text-red-600">Clique aqui para selecionar a imagem</span>
        <span className="text-xs text-slate-500">ou arraste o arquivo para esta área</span>
        <input type="file" className="hidden" accept="image/*" onChange={onFileSelect} disabled={disabled} />
      </label>
      <button
        type="button"
        onClick={onSkip}
        disabled={disabled}
        className="text-xs font-semibold text-red-500 underline transition-colors duration-200 hover:text-red-700 disabled:cursor-not-allowed disabled:text-red-300"
      >
        Pular etapa
      </button>
      {error && (
        <p className="rounded-xl bg-red-200 px-3 py-2 text-xs font-semibold text-red-900 shadow-inner">
          {error}
        </p>
      )}
    </div>
  );
}

ImageUploader.propTypes = {
  onFileSelect: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  error: PropTypes.string,
};

ImageUploader.defaultProps = {
  disabled: false,
  error: '',
};

export default ImageUploader;
