import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || String(error) }
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught an error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: '24px',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#dc2626', margin: '0 0 8px' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 16px' }}>
              An unexpected error occurred. Please reload the page.
            </p>
            <pre style={{
              background: '#f1f5f9',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#334155',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: '0 0 16px',
            }}>
              {this.state.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}