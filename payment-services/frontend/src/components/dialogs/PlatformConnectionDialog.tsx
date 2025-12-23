import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api, { type PlatformConnection } from '../../api'

interface PlatformConnectionDialogProps {
  platformType: PlatformConnection['platform_type']
  onClose: () => void
  onSuccess: () => void
}

// Helper to get display name for platform type
function getPlatformDisplayName(platformType: PlatformConnection['platform_type']): string {
  switch (platformType) {
    case 'maxio': return 'Maxio (Chargify)'
    case 'stripe': return 'Stripe'
    case 'zuora': return 'Zuora'
  }
}

export function PlatformConnectionDialog({ platformType, onClose, onSuccess }: PlatformConnectionDialogProps) {
  const [name, setName] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [isSandbox, setIsSandbox] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: api.createConnection,
    onSuccess: async (connection) => {
      // Test the connection
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

    // Validate based on platform type
    if (platformType === 'zuora') {
      if (!clientId.trim() || !clientSecret.trim()) {
        setError('Client ID and Client Secret are required for Zuora')
        return
      }
    } else {
      if (!apiKey.trim()) {
        setError('API Key is required')
        return
      }
      if (platformType === 'maxio' && !subdomain.trim()) {
        setError('Subdomain is required for Maxio')
        return
      }
    }

    createMutation.mutate({
      platform_type: platformType,
      name: name.trim(),
      subdomain: platformType === 'maxio' ? subdomain.trim() : undefined,
      api_key: platformType !== 'zuora' ? apiKey.trim() : undefined,
      client_id: platformType === 'zuora' ? clientId.trim() : undefined,
      client_secret: platformType === 'zuora' ? clientSecret.trim() : undefined,
      is_sandbox: isSandbox,
    })
  }

  const platformDisplayName = getPlatformDisplayName(platformType)

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          Add {platformDisplayName} Connection
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
                placeholder="e.g., Production, Sandbox"
              />
            </div>

            {platformType === 'maxio' && (
              <div className="form-group">
                <label className="form-label">Subdomain</label>
                <input
                  type="text"
                  className="form-input"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  placeholder="your-subdomain (from your-subdomain.chargify.com)"
                />
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Your Maxio URL is https://{subdomain || 'your-subdomain'}.chargify.com
                </div>
              </div>
            )}

            {platformType === 'zuora' ? (
              <>
                <div className="form-group">
                  <label className="form-label">Client ID</label>
                  <input
                    type="text"
                    className="form-input"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Enter your OAuth Client ID"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Client Secret</label>
                  <input
                    type="password"
                    className="form-input"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="Enter your OAuth Client Secret"
                  />
                </div>
              </>
            ) : (
              <div className="form-group">
                <label className="form-label">API Key</label>
                <input
                  type="password"
                  className="form-input"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  checked={isSandbox}
                  onChange={(e) => setIsSandbox(e.target.checked)}
                />
                <span>Sandbox / Test Environment</span>
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
              {createMutation.isPending ? 'Creating...' : 'Create Connection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
