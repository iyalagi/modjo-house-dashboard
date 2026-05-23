import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Waduh, ada masalah!</h1>
            <p className="text-gray-600 mb-6">
              Terjadi kesalahan pada aplikasi. Silakan coba muat ulang halaman.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Muat Ulang Halaman
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-4 p-2 bg-gray-100 text-left text-xs overflow-auto rounded">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
