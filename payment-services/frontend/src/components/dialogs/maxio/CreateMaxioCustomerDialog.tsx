import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import api, { type Customer } from '../../../api'
import { useToast } from '../../Toast'

interface CreateMaxioCustomerDialogProps {
  connectionId: number
  customer?: Customer  // If provided, edit mode
  onClose: () => void
  onSuccess: () => void
}

/**
 * Maxio Customer creation/edit dialog
 * Maps to: POST /customers.json or PUT /customers/{customer_id}.json
 * https://developers.maxio.com/docs/api-docs/customers
 */
export function CreateMaxioCustomerDialog({ connectionId, customer, onClose, onSuccess }: CreateMaxioCustomerDialogProps) {
  const isEditMode = !!customer
  const [firstName, setFirstName] = useState(customer?.first_name || '')
  const [lastName, setLastName] = useState(customer?.last_name || '')
  const [email, setEmail] = useState(customer?.email || '')
  const [organization, setOrganization] = useState(customer?.organization || '')
  const [reference, setReference] = useState(customer?.reference || '')
  const { showToast } = useToast()

  const createMutation = useMutation({
    mutationFn: (data: { first_name: string; last_name: string; email: string; organization?: string; reference?: string }) => {
      return api.createMaxioCustomer(connectionId, data)
    },
    onSuccess: () => {
      showToast('Customer created successfully', 'success')
      onSuccess()
    },
    onError: (err) => {
      showToast(err, 'error')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { first_name: string; last_name: string; email: string; organization?: string; reference?: string }) => {
      return api.updateMaxioCustomer(connectionId, customer!.id, data)
    },
    onSuccess: () => {
      showToast('Customer updated successfully', 'success')
      onSuccess()
    },
    onError: (err) => {
      showToast(err, 'error')
    },
  })

  const mutation = isEditMode ? updateMutation : createMutation

  // Email regex validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName.trim()) {
      showToast('First name is required', 'error')
      return
    }

    if (!lastName.trim()) {
      showToast('Last name is required', 'error')
      return
    }

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      showToast('Email is required', 'error')
      return
    }

    if (!isValidEmail(trimmedEmail)) {
      showToast('Please enter a valid email address', 'error')
      return
    }

    mutation.mutate({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      organization: organization.trim() || undefined,
      reference: reference.trim() || undefined,
    })
  }

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          {isEditMode ? 'Edit Maxio Customer' : 'Create Maxio Customer'}
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
                placeholder="john@example.com"
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
              <div className="form-hint">Optional unique identifier from your system</div>
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
              {mutation.isPending ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Customer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
