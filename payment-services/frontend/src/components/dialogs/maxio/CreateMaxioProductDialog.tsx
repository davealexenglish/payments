import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api, { type ProductFamily, type Product } from '../../../api'
import { useToast } from '../../Toast'

interface CreateMaxioProductDialogProps {
  connectionId: number
  productFamily: ProductFamily
  product?: Product  // If provided, edit mode
  onClose: () => void
  onSuccess: () => void
}

/**
 * Maxio Product creation/edit dialog
 * Maps to: POST /product_families/{product_family_id}/products.json
 * https://developers.maxio.com/docs/api-docs/products
 */
export function CreateMaxioProductDialog({ connectionId, productFamily, product, onClose, onSuccess }: CreateMaxioProductDialogProps) {
  const isEditMode = !!product
  const [name, setName] = useState(product?.name || '')
  const [handle, setHandle] = useState(product?.handle || '')
  const [description, setDescription] = useState(product?.description || '')
  const [priceInCents, setPriceInCents] = useState(product ? String(product.price_in_cents) : '')
  const [interval, setInterval] = useState(product ? String(product.interval) : '1')
  const [intervalUnit, setIntervalUnit] = useState(product?.interval_unit || 'month')
  const { showToast } = useToast()

  const createMutation = useMutation({
    mutationFn: (data: { name: string; handle?: string; description?: string; price_in_cents: number; interval: number; interval_unit: string }) => {
      return api.createMaxioProduct(connectionId, productFamily.id, data)
    },
    onSuccess: () => {
      showToast('Product created successfully', 'success')
      onSuccess()
    },
    onError: (err) => {
      showToast(err, 'error')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; handle?: string; description?: string; price_in_cents: number; interval: number; interval_unit: string }) => {
      return api.updateMaxioProduct(connectionId, product!.id, data)
    },
    onSuccess: () => {
      showToast('Product updated successfully', 'success')
      onSuccess()
    },
    onError: (err) => {
      showToast(err, 'error')
    },
  })

  const mutation = isEditMode ? updateMutation : createMutation

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      showToast('Name is required', 'error')
      return
    }

    const cents = parseInt(priceInCents, 10)
    if (isNaN(cents) || cents <= 0) {
      showToast('Price must be a positive number', 'error')
      return
    }

    const intervalNum = parseInt(interval, 10)
    if (isNaN(intervalNum) || intervalNum <= 0) {
      showToast('Interval must be a positive number', 'error')
      return
    }

    mutation.mutate({
      name: name.trim(),
      handle: handle.trim() || undefined,
      description: description.trim() || undefined,
      price_in_cents: cents,
      interval: intervalNum,
      interval_unit: intervalUnit,
    })
  }

  // Convert cents to dollar display
  const priceDisplay = priceInCents ? `$${(parseInt(priceInCents, 10) / 100).toFixed(2)}` : '$0.00'

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          {isEditMode ? 'Edit Maxio Product' : 'Create Maxio Product'}
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
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
