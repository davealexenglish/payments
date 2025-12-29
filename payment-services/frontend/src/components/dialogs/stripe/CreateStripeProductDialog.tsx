import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createStripeProduct } from '../../../api'
import { useToast } from '../../Toast'

interface CreateStripeProductDialogProps {
  connectionId: number
  onClose: () => void
  onSuccess: () => void
}

/**
 * Stripe Product creation dialog
 * Maps to: POST /v1/products
 * https://docs.stripe.com/api/products/create
 */
export function CreateStripeProductDialog({ connectionId, onClose, onSuccess }: CreateStripeProductDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const { showToast } = useToast()

  const createMutation = useMutation({
    mutationFn: () => createStripeProduct(connectionId, {
      name: name.trim(),
      description: description.trim() || undefined,
    }),
    onSuccess: () => {
      showToast('Product created successfully', 'success')
      onSuccess()
    },
    onError: (err) => {
      showToast(err, 'error')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      showToast('Name is required', 'error')
      return
    }

    createMutation.mutate()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          Create Stripe Product
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
                placeholder="e.g., Pro Plan"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional product description"
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
              disabled={createMutation.isPending || !name.trim()}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
