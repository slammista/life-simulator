import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Screen crash:', error.message, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text)' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>⚠️</p>
          <p style={{ fontSize: 14, color: 'var(--color-negative)', marginBottom: 8 }}>
            Errore nel caricamento della schermata
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: '#6366f1', color: '#fff', fontSize: 13,
            }}
          >
            Riprova
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
