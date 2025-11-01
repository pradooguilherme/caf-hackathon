import { Component } from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Erro no fluxo:', error, info);
  }

  render() {
    const { hasError } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="flex min-h-screen w-full items-center justify-center bg-red-50 px-6 text-center text-slate-700">
          <div className="max-w-md rounded-3xl bg-white px-6 py-8 shadow-bia-bot">
            <h2 className="text-xl font-semibold text-red-600">Algo saiu do ritmo.</h2>
            <p className="mt-3 text-sm">
              Desculpe, ocorreu um erro ao carregar o assistente. Recarregue a página e tente novamente.
            </p>
          </div>
        </div>
      );
    }

    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
