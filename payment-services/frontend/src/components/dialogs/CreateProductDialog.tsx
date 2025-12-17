import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api, { type ProductFamily } from '../../api'

interface CreateProductDialogProps {
  connectionId: number
  productFamily: ProductFamily
  onClose: () => void
  onSuccess: () => void
}

export function CreateProductDialog({ connectionId, productFamily, onClose, onSuccess }: CreateProductDialogProps) {
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [description, setDescription] = useState('')
  const [priceInCents, setPriceInCents] = useState('')
  const [interval, setInterval] = useState('1')
  const [intervalUnit, setIntervalUnit] = useState('month')
  const [error, setError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (data: { name: string; handle?: string; description?: string; price_in_cents: number; interval: number; interval_unit: string }) =>
      api.createMaxioProduct(connectionId, productFamily.id, data),
    onSuccess: () => {
      onSuccess()
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create product')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    const cents = parseInt(priceInCents, 10)
    if (isNaN(cents) || cents <= 0) {
      setError('Price must be a positive number')
      return
    }

    const intervalNum = parseInt(interval, 10)
    if (isNaN(intervalNum) || intervalNum <= 0) {
      setError('Interval must be a positive number')
      return
    }

    createMutation.mutate({
      name: name.trim(),
      handle: handle.trim() || undefined,
      description: description.trim() || undefined,
      price_in_cents: cents,
      interval: intervalNum,
      interval_unit: intervalUnit,
    })
  }

  // Convert cents to dollar display for helper text
  const priceDisplay = priceInCents ? `$${(parseInt(priceInCents, 10) / 100).toFixed(2)}` : '$0.00'

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          Create Product
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Product Family</label>
              <div className="form-static">{productFamily.name}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Basic Monthly"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Handle</label>
              <input
                type="text"
                className="form-input"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g., basic-monthly"
              />
              <div className="form-hint">URL-friendly identifier (auto-generated if empty)</div>
            </div>

            <div className="form-group">
              <label className="form-label">Price (in cents) *</label>
              <input
                type="number"
                className="form-input"
                value={priceInCents}
                onChange={(e) => setPriceInCents(e.target.value)}
                placeholder="e.g., 1999 for $19.99"
                min="1"
              />
              <div className="form-hint">Display: {priceDisplay}</div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Interval *</label>
                <input
                  type="number"
                  className="form-input"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  min="1"
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Interval Unit *</label>
                <select
                  className="form-input"
                  value={intervalUnit}
                  onChange={(e) => setIntervalUnit(e.target.value)}
                >
                  <option value="day">Day(s)</option>
                  <option value="week">Week(s)</option>
                  <option value="month">Month(s)</option>
                </select>
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
              {createMutation.isPending ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
