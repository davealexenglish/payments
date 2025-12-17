import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface Toast {
  id: number
  message: string
  type: 'error' | 'success' | 'info'
}

interface ToastContextType {
  showToast: (message: string | unknown, type?: 'error' | 'success' | 'info') => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Parse API error to extract meaningful message
function parseApiError(err: unknown): string {
  // Handle axios errors - get the response data
  let message = ''

  console.log('parseApiError input:', err)

  // Check if it's an axios error with response data
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { data?: { error?: string }, status?: number } }
    console.log('axios response data:', axiosErr.response?.data)
    if (axiosErr.response?.data?.error) {
      message = axiosErr.response.data.error
    } else if (axiosErr.response?.status) {
      message = `Request failed with status ${axiosErr.response.status}`
    }
  }

  // Fall back to error message
  if (!message && err instanceof Error) {
    message = err.message
  }

  if (!message) {
    return 'An error occurred'
  }

  console.log('message before parsing:', message)

  // Parse the message: "API error (status 422): {\"errors\":[\"...\"]}"
  const jsonMatch = message.match(/^(.*?):\s*(\{.*\})$/)
  console.log('jsonMatch:', jsonMatch)
  if (jsonMatch) {
    const prefix = jsonMatch[1] // e.g., "API error (status 422)"
    try {
      const parsed = JSON.parse(jsonMatch[2])
      console.log('parsed JSON:', parsed)
      if (parsed.errors && Array.isArray(parsed.errors)) {
        // Format: first line is the status, then each error on its own line
        const result = `${prefix}\n${parsed.errors.join('\n')}`
        console.log('final result:', result)
        return result
      }
    } catch (e) {
      console.log('JSON parse error:', e)
    }
  }
  return message
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  let nextId = 0

  const showToast = useCallback((messageOrError: string | unknown, type: 'error' | 'success' | 'info' = 'error') => {
    let parsedMessage: string
    if (type === 'error') {
      parsedMessage = parseApiError(messageOrError)
    } else if (typeof messageOrError === 'string') {
      parsedMessage = messageOrError
    } else {
      parsedMessage = 'An error occurred'
    }
    const id = nextId++
    setToasts(prev => [...prev, { id, message: parsedMessage, type }])

    // Auto-remove after 8 seconds for errors, 4 seconds for others
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, type === 'error' ? 8000 : 4000)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast-message">{toast.message}</div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>&times;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
