import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            isFirestoreError = true;
            errorMessage = `Erro de permissão no banco de dados (${parsed.operationType}). Por favor, verifique sua conexão ou tente novamente.`;
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-red-100 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                <AlertCircle size={32} />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-zinc-900">Ops! Algo deu errado</h2>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw size={18} />
              <span>Tentar Novamente</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
