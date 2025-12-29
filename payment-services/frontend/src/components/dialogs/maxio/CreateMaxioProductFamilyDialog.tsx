import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../../../api'
import { useToast } from '../../Toast'

interface CreateMaxioProductFamilyDialogProps {
  connectionId: number
  onClose: () => void
  onSuccess: () => void
}

/**
 * Maxio Product Family creation dialog
 * Maps to: POST /product_families.json
 * https://developers.maxio.com/docs/api-docs/product-families
 */
export function CreateMaxioProductFamilyDialog({ connectionId, onClose, onSuccess }: CreateMaxioProductFamilyDialogProps) {
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [description, setDescription] = useState('')
  const { showToast } = useToast()

  const createMutation = useMutation({
    mutationFn: () => api.createMaxioProductFamily(connectionId, {
      name: name.trim(),
      handle: handle.trim() || undefined,
      description: description.trim() || undefined,
    }),
    onSuccess: () => {
      showToast('Product Family created successfully', 'success')
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
          Create Maxio Product Family
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
                placeholder="e.g., SaaS Plans"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Handle</label>
              <input
                type="text"
                className="form-input"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g., saas-plans"
              />
              <div className="form-hint">URL-friendly identifier (auto-generated if empty)</div>
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
              disabled={createMutation.isPending || !name.trim()}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Product Family'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
