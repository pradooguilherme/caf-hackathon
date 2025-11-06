import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Erro capturado no ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-red-50">
          <div className="bg-white p-6 rounded-2xl shadow-md text-center max-w-md">
            <h1 className="text-xl font-semibold text-red-600 mb-2">
              Algo saiu do ritmo.
            </h1>
            <p className="text-gray-700">
              Desculpe, ocorreu um erro ao carregar o assistente.{'  '}
              Recarregue a página e tente novamente.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
