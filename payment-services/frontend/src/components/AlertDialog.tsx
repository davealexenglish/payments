import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface AlertOptions {
  title?: string
  message: string
  buttonLabel?: string
  type?: 'info' | 'error' | 'warning' | 'success'
}

interface AlertContextType {
  alert: (options: AlertOptions | string) => Promise<void>
}

const AlertContext = createContext<AlertContextType | null>(null)

export function useAlert() {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider')
  }
  return context.alert
}

interface AlertProviderProps {
  children: ReactNode
}

export function AlertProvider({ children }: AlertProviderProps) {
  const [dialog, setDialog] = useState<{
    options: AlertOptions
    resolve: () => void
  } | null>(null)

  const alert = useCallback((options: AlertOptions | string): Promise<void> => {
    return new Promise((resolve) => {
      const opts = typeof options === 'string' ? { message: options } : options
      setDialog({ options: opts, resolve })
    })
  }, [])

  const handleClose = useCallback(() => {
    dialog?.resolve()
    setDialog(null)
  }, [dialog])

  const getTypeStyles = (type?: string) => {
    switch (type) {
      case 'error':
        return { borderLeft: '4px solid var(--error-color)' }
      case 'warning':
        return { borderLeft: '4px solid #f59e0b' }
      case 'success':
        return { borderLeft: '4px solid #22c55e' }
      default:
        return { borderLeft: '4px solid var(--accent-color)' }
    }
  }

  const getTitle = (options: AlertOptions) => {
    if (options.title) return options.title
    switch (options.type) {
      case 'error': return 'Error'
      case 'warning': return 'Warning'
      case 'success': return 'Success'
      default: return 'Notice'
    }
  }

  return (
    <AlertContext.Provider value={{ alert }}>
      {children}
      {dialog && (
        <div className="modal-overlay">
          <div
            className="modal-dialog"
            style={{ minWidth: '350px', maxWidth: '450px', ...getTypeStyles(dialog.options.type) }}
          >
            <div className="modal-header">
              {getTitle(dialog.options)}
              <button className="modal-close" onClick={handleClose}>
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ padding: '16px 20px' }}>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
                {dialog.options.message}
              </p>
            </div>
            <div className="modal-footer" style={{ padding: '12px 20px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleClose}
              >
                {dialog.options.buttonLabel || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  )
}
