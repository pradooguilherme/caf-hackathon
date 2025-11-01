import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import MessageBubble from './MessageBubble.jsx';

function ChatWindow({ messages, isTyping }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto bg-red-50 px-5 py-6">
      <div className="space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            sender={message.sender}
            text={message.text}
            attachment={message.attachment}
            type={message.type}
          />
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-3xl bg-red-500 px-4 py-3 text-white shadow-bia-bot">
              <span className="text-xs font-semibold uppercase tracking-wide">Bia</span>
              <span className="flex h-2 gap-1">
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-white/90 [animation-delay:-0.2s]" />
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-white/90 [animation-delay:-0.1s]" />
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-white/90" />
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

ChatWindow.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      sender: PropTypes.oneOf(['bot', 'user']).isRequired,
      text: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      attachment: PropTypes.shape({
        type: PropTypes.string,
        name: PropTypes.string,
        preview: PropTypes.string,
      }),
    }),
  ).isRequired,
  isTyping: PropTypes.bool.isRequired,
};

export default ChatWindow;
