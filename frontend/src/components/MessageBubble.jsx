import PropTypes from 'prop-types';

function MessageBubble({ sender, text, attachment, type }) {
  const isBot = sender === 'bot';
  const isStatusSuccess = type === 'status-success';
  const isStatusError = type === 'status-error';
  const isStatus = isStatusSuccess || isStatusError;
  const isPrivacyNotice = type === 'privacy';

  const alignmentClass = isStatus || isBot || isPrivacyNotice ? 'justify-start' : 'justify-end';

  const bubbleClasses = (() => {
    if (isPrivacyNotice) {
      return 'self-start rounded-lg border border-red-200 bg-white px-5 py-4 text-sm text-red-900 shadow-md';
    }
    if (isStatusSuccess) {
      return 'bg-green-100 text-green-800 self-start border border-green-300';
    }
    if (isStatusError) {
      return 'bg-red-200 text-red-900 self-start border border-red-300';
    }
    return isBot
      ? 'bg-red-400 text-white self-start shadow-bia-bot'
      : 'bg-red-700 text-white self-end shadow-bia-user';
  })();

  return (
    <div className={`flex ${alignmentClass}`}>
      <div
        className={`mb-3 max-w-[80%] text-sm transition-all duration-300 ease-in-out ${
          isStatus || isPrivacyNotice ? '' : 'rounded-2xl bg-transparent px-0 py-0'
        }`}
      >
        <div
          className={`${
            isPrivacyNotice ? '' : 'rounded-2xl px-4 py-3'
          } ${isStatus || isPrivacyNotice ? '' : 'shadow-md'} ${bubbleClasses}`}
        >
          <p className="whitespace-pre-line leading-relaxed">{text}</p>
          {type === 'attachment' && attachment?.preview && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/40 bg-white/5">
              <img
                src={attachment.preview}
                alt={attachment.name || 'Anexo'}
                className="h-40 w-full object-cover"
              />
              <div className="bg-white/25 px-3 py-1 text-[11px] uppercase tracking-wide">
                {attachment.name}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

MessageBubble.propTypes = {
  sender: PropTypes.oneOf(['bot', 'user']).isRequired,
  text: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  attachment: PropTypes.shape({
    type: PropTypes.string,
    name: PropTypes.string,
    preview: PropTypes.string,
  }),
};

MessageBubble.defaultProps = {
  attachment: null,
};

export default MessageBubble;
