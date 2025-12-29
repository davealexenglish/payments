import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createStripeCoupon, type StripeCouponRequest } from '../../../api'
import { useToast } from '../../Toast'

interface CreateStripeCouponDialogProps {
  connectionId: number
  onClose: () => void
  onSuccess: () => void
}

/**
 * Stripe Coupon creation dialog
 * Maps to: POST /v1/coupons
 * https://docs.stripe.com/api/coupons/create
 */
export function CreateStripeCouponDialog({ connectionId, onClose, onSuccess }: CreateStripeCouponDialogProps) {
  // Coupon ID (optional - Stripe generates one if not provided)
  const [couponId, setCouponId] = useState('')
  const [name, setName] = useState('')

  // Discount type
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent')
  const [percentOff, setPercentOff] = useState('')
  const [amountOff, setAmountOff] = useState('')
  const [currency, setCurrency] = useState('usd')

  // Duration
  const [duration, setDuration] = useState<'once' | 'repeating' | 'forever'>('once')
  const [durationInMonths, setDurationInMonths] = useState('')

  // Limits
  const [maxRedemptions, setMaxRedemptions] = useState('')
  const [redeemByEnabled, setRedeemByEnabled] = useState(false)
  const [redeemByDate, setRedeemByDate] = useState('')

  const { showToast } = useToast()

  const createMutation = useMutation({
    mutationFn: () => {
      const req: StripeCouponRequest = {
        duration,
      }

      if (couponId.trim()) {
        req.id = couponId.trim()
      }

      if (name.trim()) {
        req.name = name.trim()
      }

      if (discountType === 'percent') {
        req.percent_off = parseFloat(percentOff)
      } else {
        req.amount_off = parseInt(amountOff, 10)
        req.currency = currency
      }

      if (duration === 'repeating') {
        req.duration_in_months = parseInt(durationInMonths, 10)
      }

      if (maxRedemptions.trim()) {
        req.max_redemptions = parseInt(maxRedemptions, 10)
      }

      if (redeemByEnabled && redeemByDate) {
        req.redeem_by = Math.floor(new Date(redeemByDate).getTime() / 1000)
      }

      return createStripeCoupon(connectionId, req)
    },
    onSuccess: () => {
      showToast('Coupon created successfully', 'success')
      onSuccess()
    },
    onError: (err) => {
      showToast(err, 'error')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate discount
    if (discountType === 'percent') {
      const pct = parseFloat(percentOff)
      if (isNaN(pct) || pct <= 0 || pct > 100) {
        showToast('Percent off must be between 0.01 and 100', 'error')
        return
      }
    } else {
      const amt = parseInt(amountOff, 10)
      if (isNaN(amt) || amt <= 0) {
        showToast('Amount off must be a positive number', 'error')
        return
      }
    }

    // Validate duration_in_months for repeating
    if (duration === 'repeating') {
      const months = parseInt(durationInMonths, 10)
      if (isNaN(months) || months <= 0) {
        showToast('Duration in months must be a positive number', 'error')
        return
      }
    }

    // Validate max redemptions if provided
    if (maxRedemptions.trim()) {
      const max = parseInt(maxRedemptions, 10)
      if (isNaN(max) || max <= 0) {
        showToast('Max redemptions must be a positive number', 'error')
        return
      }
    }

    // Validate redeem by date
    if (redeemByEnabled && !redeemByDate) {
      showToast('Please select an expiration date', 'error')
      return
    }

    createMutation.mutate()
  }

  // Two-column form row style
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    gap: '8px',
  }

  const labelStyle: React.CSSProperties = {
    flex: '0 0 130px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
    textAlign: 'right',
    paddingRight: '8px',
  }

  const inputContainerStyle: React.CSSProperties = {
    flex: 1,
  }

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          Create Stripe Coupon
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '12px 16px' }}>
            {/* Basic Info */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Basic Info
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Coupon ID</label>
                <div style={inputContainerStyle}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '13px', padding: '6px 8px' }}
                    value={couponId}
                    onChange={(e) => setCouponId(e.target.value)}
                    placeholder="Auto-generated if empty"
                  />
                </div>
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
                    placeholder="e.g., Summer Sale 20%"
                  />
                </div>
              </div>
            </div>

            {/* Discount */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Discount
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Discount Type *</label>
                <div style={inputContainerStyle}>
                  <select
                    className="form-input"
                    style={{ fontSize: '13px', padding: '6px 8px' }}
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percent' | 'amount')}
                  >
                    <option value="percent">Percentage off</option>
                    <option value="amount">Fixed amount off</option>
                  </select>
                </div>
              </div>

              {discountType === 'percent' ? (
                <div style={rowStyle}>
                  <label style={labelStyle}>Percent Off *</label>
                  <div style={{ ...inputContainerStyle, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      className="form-input"
                      style={{ fontSize: '13px', padding: '6px 8px', width: '80px' }}
                      value={percentOff}
                      onChange={(e) => setPercentOff(e.target.value)}
                      min="0.01"
                      max="100"
                      step="0.01"
                    />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>%</span>
                  </div>
                </div>
              ) : (
                <>
                  <div style={rowStyle}>
                    <label style={labelStyle}>Amount Off *</label>
                    <div style={{ ...inputContainerStyle, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        className="form-input"
                        style={{ fontSize: '13px', padding: '6px 8px', width: '100px' }}
                        value={amountOff}
                        onChange={(e) => setAmountOff(e.target.value)}
                        min="1"
                        placeholder="In cents"
                      />
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        ({amountOff ? `$${(parseInt(amountOff, 10) / 100).toFixed(2)}` : '$0.00'})
                      </span>
                    </div>
                  </div>
                  <div style={rowStyle}>
                    <label style={labelStyle}>Currency</label>
                    <div style={inputContainerStyle}>
                      <select
                        className="form-input"
                        style={{ fontSize: '13px', padding: '6px 8px', width: '100px' }}
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                      >
                        <option value="usd">USD</option>
                        <option value="eur">EUR</option>
                        <option value="gbp">GBP</option>
                        <option value="cad">CAD</option>
                        <option value="aud">AUD</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Duration */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Duration
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Duration *</label>
                <div style={inputContainerStyle}>
                  <select
                    className="form-input"
                    style={{ fontSize: '13px', padding: '6px 8px' }}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value as 'once' | 'repeating' | 'forever')}
                  >
                    <option value="once">Once (single payment)</option>
                    <option value="repeating">Repeating (multiple months)</option>
                    <option value="forever">Forever</option>
                  </select>
                </div>
              </div>

              {duration === 'repeating' && (
                <div style={rowStyle}>
                  <label style={labelStyle}>Months *</label>
                  <div style={inputContainerStyle}>
                    <input
                      type="number"
                      className="form-input"
                      style={{ fontSize: '13px', padding: '6px 8px', width: '80px' }}
                      value={durationInMonths}
                      onChange={(e) => setDurationInMonths(e.target.value)}
                      min="1"
                      placeholder="e.g., 3"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Limits */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Limits (Optional)
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Max Redemptions</label>
                <div style={inputContainerStyle}>
                  <input
                    type="number"
                    className="form-input"
                    style={{ fontSize: '13px', padding: '6px 8px', width: '80px' }}
                    value={maxRedemptions}
                    onChange={(e) => setMaxRedemptions(e.target.value)}
                    min="1"
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Expires</label>
                <div style={inputContainerStyle}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={redeemByEnabled}
                      onChange={(e) => setRedeemByEnabled(e.target.checked)}
                    />
                    {redeemByEnabled && (
                      <input
                        type="date"
                        className="form-input"
                        style={{ fontSize: '13px', padding: '4px 8px' }}
                        value={redeemByDate}
                        onChange={(e) => setRedeemByDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    )}
                    {!redeemByEnabled && (
                      <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>No expiration</span>
                    )}
                  </label>
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
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
