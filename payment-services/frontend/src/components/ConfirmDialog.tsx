import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context.confirm
}

interface ConfirmProviderProps {
  children: ReactNode
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [dialog, setDialog] = useState<{
    options: ConfirmOptions
    resolve: (value: boolean) => void
  } | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({ options, resolve })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    dialog?.resolve(true)
    setDialog(null)
  }, [dialog])

  const handleCancel = useCallback(() => {
    dialog?.resolve(false)
    setDialog(null)
  }, [dialog])

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ minWidth: '350px', maxWidth: '450px' }}>
            <div className="modal-header">
              {dialog.options.title || 'Confirm'}
              <button className="modal-close" onClick={handleCancel}>
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
                className="btn btn-secondary"
                onClick={handleCancel}
              >
                {dialog.options.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                className={`btn ${dialog.options.danger ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleConfirm}
                style={dialog.options.danger ? { backgroundColor: 'var(--error-color)', color: 'white' } : undefined}
              >
                {dialog.options.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
