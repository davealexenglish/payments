import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../../api'

interface CreateCustomerDialogProps {
  connectionId: number
  onClose: () => void
  onSuccess: () => void
}

export function CreateCustomerDialog({ connectionId, onClose, onSuccess }: CreateCustomerDialogProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [organization, setOrganization] = useState('')
  const [reference, setReference] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (data: { first_name: string; last_name: string; email: string; organization?: string; reference?: string }) =>
      api.createMaxioCustomer(connectionId, data),
    onSuccess: () => {
      onSuccess()
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create customer')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!firstName.trim()) {
      setError('First name is required')
      return
    }

    if (!lastName.trim()) {
      setError('Last name is required')
      return
    }

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    createMutation.mutate({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      organization: organization.trim() || undefined,
      reference: reference.trim() || undefined,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          Create Customer
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                className="form-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                className="form-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Organization</label>
              <input
                type="text"
                className="form-input"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Acme Inc."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Reference</label>
              <input
                type="text"
                className="form-input"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Your internal customer ID"
              />
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Optional unique identifier from your system
              </div>
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
              {createMutation.isPending ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
