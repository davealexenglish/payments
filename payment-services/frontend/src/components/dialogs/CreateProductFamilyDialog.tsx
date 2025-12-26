import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api, { createStripeProduct } from '../../api'

interface CreateProductFamilyDialogProps {
  connectionId: number
  platformType: string
  onClose: () => void
  onSuccess: () => void
}

export function CreateProductFamilyDialog({ connectionId, platformType, onClose, onSuccess }: CreateProductFamilyDialogProps) {
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  // For Stripe, "Product Family" maps to creating a Product (which can have multiple Prices)
  const createMutation = useMutation({
    mutationFn: (data: { name: string; handle?: string; description?: string }) => {
      if (platformType === 'stripe') {
        return createStripeProduct(connectionId, { name: data.name, description: data.description })
      }
      // Zuora doesn't support creating products via API in the same way
      // For now, only Maxio and Stripe are supported
      return api.createMaxioProductFamily(connectionId, data)
    },
    onSuccess: () => {
      onSuccess()
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create product family')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    createMutation.mutate({
      name: name.trim(),
      handle: handle.trim() || undefined,
      description: description.trim() || undefined,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          Create Product Family
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Basic Plans"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Handle</label>
              <input
                type="text"
                className="form-input"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g., basic-plans"
              />
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                URL-friendly identifier (auto-generated if empty)
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
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
              {createMutation.isPending ? 'Creating...' : 'Create Family'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
