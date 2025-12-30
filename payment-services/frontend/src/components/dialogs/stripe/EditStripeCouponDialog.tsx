import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { updateStripeCoupon, type StripeCoupon } from '../../../api'
import { useToast } from '../../Toast'

interface EditStripeCouponDialogProps {
  connectionId: number
  coupon: StripeCoupon
  onClose: () => void
  onSuccess: () => void
}

/**
 * Stripe Coupon edit dialog
 * Note: Stripe only allows updating the coupon name after creation
 * https://docs.stripe.com/api/coupons/update
 */
export function EditStripeCouponDialog({ connectionId, coupon, onClose, onSuccess }: EditStripeCouponDialogProps) {
  const [name, setName] = useState(coupon.name || '')
  const { showToast } = useToast()

  const updateMutation = useMutation({
    mutationFn: () => updateStripeCoupon(connectionId, coupon.id, name.trim()),
    onSuccess: () => {
      showToast('Coupon updated successfully', 'success')
      onSuccess()
    },
    onError: (err) => {
      showToast(err, 'error')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate()
  }

  // Format the discount for display
  const discountText = coupon.percent_off
    ? `${coupon.percent_off}% off`
    : coupon.amount_off
      ? `$${(coupon.amount_off / 100).toFixed(2)} off`
      : ''

  const durationText = coupon.duration === 'once'
    ? 'Once'
    : coupon.duration === 'forever'
      ? 'Forever'
      : `${coupon.duration_in_months} months`

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

  const valueStyle: React.CSSProperties = {
    flex: 1,
    fontSize: '13px',
    color: 'var(--text-primary)',
  }

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          Edit Coupon
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '12px 16px' }}>
            {/* Read-only coupon info */}
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Coupon Details (Read-only)
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>ID</span>
                <span style={valueStyle}><code>{coupon.id}</code></span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Discount</span>
                <span style={valueStyle}>{discountText}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Duration</span>
                <span style={valueStyle}>{durationText}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Times Used</span>
                <span style={valueStyle}>{coupon.times_redeemed}</span>
              </div>
              <div style={rowStyle}>
                <span style={labelStyle}>Valid</span>
                <span style={valueStyle}>{coupon.valid ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {/* Editable name */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Editable Fields
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Name</label>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '13px', padding: '6px 8px' }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Summer Sale 20%"
                  />
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', paddingLeft: '108px' }}>
                Note: Stripe only allows updating the coupon name after creation.
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
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
