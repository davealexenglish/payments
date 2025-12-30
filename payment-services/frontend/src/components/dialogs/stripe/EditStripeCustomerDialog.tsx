import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { updateStripeCustomer, type Customer, type CreateCustomerRequest } from '../../../api'
import { useToast } from '../../Toast'

interface EditStripeCustomerDialogProps {
  connectionId: number
  customer: Customer
  onClose: () => void
  onSuccess: (updatedCustomer: Customer) => void
}

/**
 * Stripe Customer edit dialog
 * Maps to: POST /v1/customers/{id}
 * https://docs.stripe.com/api/customers/update
 *
 * Mutable fields: name, email, phone, description, metadata, address, etc.
 * Read-only fields: id, created, livemode, delinquent
 */
export function EditStripeCustomerDialog({ connectionId, customer, onClose, onSuccess }: EditStripeCustomerDialogProps) {
  // Mutable fields
  const [name, setName] = useState(`${customer.first_name || ''} ${customer.last_name || ''}`.trim())
  const [email, setEmail] = useState(customer.email || '')
  const [organization, setOrganization] = useState(customer.organization || '')
  const { showToast } = useToast()

  const updateMutation = useMutation({
    mutationFn: async () => {
      const nameParts = name.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      const req: CreateCustomerRequest = {
        first_name: firstName,
        last_name: lastName,
        email: email.trim(),
        organization: organization.trim() || undefined,
      }
      const result = await updateStripeCustomer(connectionId, customer.id, req)
      return result
    },
    onSuccess: (updatedCustomer) => {
      showToast('Customer updated successfully', 'success')
      onSuccess(updatedCustomer)
    },
    onError: (err) => {
      showToast(err, 'error')
    },
  })

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

    updateMutation.mutate()
  }

  // Two-column form row style
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    gap: '8px',
  }

  const labelStyle: React.CSSProperties = {
    flex: '0 0 100px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    textAlign: 'right',
    paddingRight: '8px',
  }

  const inputContainerStyle: React.CSSProperties = {
    flex: 1,
  }

  const readOnlyStyle: React.CSSProperties = {
    fontSize: '13px',
    padding: '6px 0',
    color: 'var(--text-primary)',
    fontFamily: 'monospace',
  }

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: '450px' }}>
        <div className="modal-header">
          Edit Stripe Customer
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '12px 16px' }}>
            {/* Read-only section */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Customer Info (Read-only)
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>ID</label>
                <div style={{ ...inputContainerStyle, ...readOnlyStyle }}>{customer.id}</div>
              </div>

              {customer.created_at && (
                <div style={rowStyle}>
                  <label style={labelStyle}>Created</label>
                  <div style={{ ...inputContainerStyle, ...readOnlyStyle }}>
                    {new Date(customer.created_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            {/* Editable section */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Editable Fields
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Name</label>
                <div style={inputContainerStyle}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '13px', padding: '6px 8px' }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Email *</label>
                <div style={inputContainerStyle}>
                  <input
                    type="email"
                    className="form-input"
                    style={{ fontSize: '13px', padding: '6px 8px' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Description</label>
                <div style={inputContainerStyle}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '13px', padding: '6px 8px' }}
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Organization or notes"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer" style={{ padding: '12px 16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateMutation.isPending || !email.trim()}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
