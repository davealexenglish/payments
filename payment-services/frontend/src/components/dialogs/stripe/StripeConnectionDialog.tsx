import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Copy, Eye, EyeOff } from 'lucide-react'
import api from '../../../api'

interface StripeConnectionDialogProps {
  connectionId?: number  // If provided, edit mode
  existingData?: {
    name: string
    is_sandbox: boolean
    api_key?: string  // Masked in edit mode
  }
  onClose: () => void
  onSuccess: () => void
}

export function StripeConnectionDialog({
  connectionId,
  existingData,
  onClose,
  onSuccess
}: StripeConnectionDialogProps) {
  const isEditMode = !!connectionId

  const [name, setName] = useState(existingData?.name || '')
  const [apiKey, setApiKey] = useState('')
  const [isSandbox, setIsSandbox] = useState(existingData?.is_sandbox ?? true)
  const [showApiKey, setShowApiKey] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: api.createConnection,
    onSuccess: async (connection) => {
      try {
        await api.testConnection(connection.id)
      } catch {
        // Connection created but test failed - that's ok
      }
      onSuccess()
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create connection')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!isEditMode && !apiKey.trim()) {
      setError('API Key is required')
      return
    }

    if (isEditMode) {
      // TODO: Implement update connection API
      onSuccess()
    } else {
      createMutation.mutate({
        platform_type: 'stripe',
        name: name.trim(),
        api_key: apiKey.trim(),
        is_sandbox: isSandbox,
      })
    }
  }

  const handleCopyApiKey = () => {
    if (existingData?.api_key) {
      navigator.clipboard.writeText(existingData.api_key)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          {isEditMode ? 'Edit' : 'Add'} Stripe Connection
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Connection Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Production, Test"
              />
            </div>

            <div className="form-group">
              <label className="form-label">API Key</label>
              {isEditMode && existingData?.api_key ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    className="form-input"
                    value={existingData.api_key}
                    readOnly
                    style={{ flex: 1, backgroundColor: 'var(--bg-secondary)' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                    title={showApiKey ? 'Hide' : 'Show'}
                  >
                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleCopyApiKey}
                    title="Copy to clipboard"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              ) : (
                <input
                  type="password"
                  className="form-input"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk_test_... or sk_live_..."
                />
              )}
              {isEditMode && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  API key cannot be changed. Delete and recreate the connection to use a different key.
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={isSandbox}
                  onChange={(e) => setIsSandbox(e.target.checked)}
                />
                <span>Test Mode (use sk_test_ key)</span>
              </label>
            </div>

            {error && <div className="form-error">{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Connection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
