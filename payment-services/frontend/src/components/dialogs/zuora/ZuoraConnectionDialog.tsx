import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Copy, Eye, EyeOff } from 'lucide-react'
import api from '../../../api'

// Zuora data center options
const ZUORA_ENDPOINTS = [
  { label: 'NA Sandbox', value: 'https://rest.sandbox.na.zuora.com', sandbox: true },
  { label: 'EU Sandbox', value: 'https://rest.sandbox.eu.zuora.com', sandbox: true },
  { label: 'US API Sandbox (Legacy)', value: 'https://rest.apisandbox.zuora.com', sandbox: true },
  { label: 'NA Production', value: 'https://rest.na.zuora.com', sandbox: false },
  { label: 'EU Production', value: 'https://rest.eu.zuora.com', sandbox: false },
  { label: 'US Production (Legacy)', value: 'https://rest.zuora.com', sandbox: false },
]

interface ZuoraConnectionDialogProps {
  connectionId?: number  // If provided, edit mode
  existingData?: {
    name: string
    base_url: string
    is_sandbox: boolean
    client_id?: string
    client_secret?: string  // Masked in edit mode
  }
  onClose: () => void
  onSuccess: () => void
}

export function ZuoraConnectionDialog({
  connectionId,
  existingData,
  onClose,
  onSuccess
}: ZuoraConnectionDialogProps) {
  const isEditMode = !!connectionId

  const [name, setName] = useState(existingData?.name || '')
  const [baseUrl, setBaseUrl] = useState(existingData?.base_url || 'https://rest.sandbox.na.zuora.com')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [showClientId, setShowClientId] = useState(false)
  const [showClientSecret, setShowClientSecret] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Derive isSandbox from baseUrl
  const isSandbox = ZUORA_ENDPOINTS.find(e => e.value === baseUrl)?.sandbox ?? true

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
    if (!isEditMode && (!clientId.trim() || !clientSecret.trim())) {
      setError('Client ID and Client Secret are required')
      return
    }

    if (isEditMode) {
      // TODO: Implement update connection API
      onSuccess()
    } else {
      createMutation.mutate({
        platform_type: 'zuora',
        name: name.trim(),
        base_url: baseUrl,
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        is_sandbox: isSandbox,
      })
    }
  }

  const handleCopyClientId = () => {
    if (existingData?.client_id) {
      navigator.clipboard.writeText(existingData.client_id)
    }
  }

  const handleCopyClientSecret = () => {
    if (existingData?.client_secret) {
      navigator.clipboard.writeText(existingData.client_secret)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          {isEditMode ? 'Edit' : 'Add'} Zuora Connection
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

            <div className="form-group">
              <label className="form-label">Data Center / Environment</label>
              <select
                className="form-input"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                disabled={isEditMode}
              >
                {ZUORA_ENDPOINTS.map(endpoint => (
                  <option key={endpoint.value} value={endpoint.value}>
                    {endpoint.label}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                API Endpoint: {baseUrl}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Client ID</label>
              {isEditMode && existingData?.client_id ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type={showClientId ? 'text' : 'password'}
                    className="form-input"
                    value={existingData.client_id}
                    readOnly
                    style={{ flex: 1, backgroundColor: 'var(--bg-secondary)' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowClientId(!showClientId)}
                    title={showClientId ? 'Hide' : 'Show'}
                  >
                    {showClientId ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleCopyClientId}
                    title="Copy to clipboard"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  className="form-input"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter your OAuth Client ID"
                />
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Client Secret</label>
              {isEditMode && existingData?.client_secret ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type={showClientSecret ? 'text' : 'password'}
                    className="form-input"
                    value={existingData.client_secret}
                    readOnly
                    style={{ flex: 1, backgroundColor: 'var(--bg-secondary)' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowClientSecret(!showClientSecret)}
                    title={showClientSecret ? 'Hide' : 'Show'}
                  >
                    {showClientSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleCopyClientSecret}
                    title="Copy to clipboard"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              ) : (
                <input
                  type="password"
                  className="form-input"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter your OAuth Client Secret"
                />
              )}
              {isEditMode && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Credentials cannot be changed. Delete and recreate the connection to use different credentials.
                </div>
              )}
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
