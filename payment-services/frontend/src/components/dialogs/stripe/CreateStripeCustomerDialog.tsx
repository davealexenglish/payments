import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createStripeCustomer, type StripeCustomerRequest } from '../../../api'
import { useToast } from '../../Toast'

interface CreateStripeCustomerDialogProps {
  connectionId: number
  onClose: () => void
  onSuccess: () => void
}

/**
 * Stripe Customer creation dialog
 * Maps to: POST /v1/customers
 * https://docs.stripe.com/api/customers/create
 */
export function CreateStripeCustomerDialog({ connectionId, onClose, onSuccess }: CreateStripeCustomerDialogProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const { showToast } = useToast()

  const createMutation = useMutation({
    mutationFn: () => {
      const req: StripeCustomerRequest = {
        name: name.trim() || undefined,
        email: email.trim(),
        phone: phone.trim() || undefined,
        description: description.trim() || undefined,
      }
      return createStripeCustomer(connectionId, req)
    },
    onSuccess: () => {
      showToast('Customer created successfully', 'success')
      onSuccess()
    },
    onError: (err) => {
      showToast(err, 'error')
    },
  })

  // Email regex validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      showToast('Email is required', 'error')
      return
    }

    if (!isValidEmail(trimmedEmail)) {
      showToast('Please enter a valid email address', 'error')
      return
    }

    createMutation.mutate()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          Create Stripe Customer
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
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
              disabled={createMutation.isPending || !email.trim()}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
