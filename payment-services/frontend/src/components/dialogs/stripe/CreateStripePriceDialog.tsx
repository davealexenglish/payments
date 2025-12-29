import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createStripePrice, type ProductFamily, type StripePriceRequest } from '../../../api'
import { useToast } from '../../Toast'

interface CreateStripePriceDialogProps {
  connectionId: number
  product: ProductFamily  // In Stripe, Product maps to our ProductFamily type
  onClose: () => void
  onSuccess: () => void
}

/**
 * Stripe Price creation dialog
 * Maps to: POST /v1/prices
 * https://docs.stripe.com/api/prices/create
 */
export function CreateStripePriceDialog({ connectionId, product, onClose, onSuccess }: CreateStripePriceDialogProps) {
  const [unitAmount, setUnitAmount] = useState('')
  const [currency, setCurrency] = useState('usd')
  const [interval, setInterval] = useState('month')
  const [intervalCount, setIntervalCount] = useState('1')
  const { showToast } = useToast()

  const createMutation = useMutation({
    mutationFn: () => {
      const req: StripePriceRequest = {
        price_in_cents: parseInt(unitAmount, 10),
        currency: currency,
        interval: parseInt(intervalCount, 10),
        interval_unit: interval,
      }
      return createStripePrice(connectionId, product.id, req)
    },
    onSuccess: () => {
      showToast('Price created successfully', 'success')
      onSuccess()
    },
    onError: (err) => {
      showToast(err, 'error')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const amount = parseInt(unitAmount, 10)
    if (isNaN(amount) || amount <= 0) {
      showToast('Amount must be a positive number', 'error')
      return
    }

    const count = parseInt(intervalCount, 10)
    if (isNaN(count) || count <= 0) {
      showToast('Interval count must be a positive number', 'error')
      return
    }

    createMutation.mutate()
  }

  // Display price in selected currency
  const currencySymbols: Record<string, string> = { usd: '$', eur: '€', gbp: '£', cad: 'C$', aud: 'A$' }
  const symbol = currencySymbols[currency] || currency.toUpperCase() + ' '
  const priceDisplay = unitAmount ? `${symbol}${(parseInt(unitAmount, 10) / 100).toFixed(2)}` : `${symbol}0.00`

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          Create Stripe Price
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Product</label>
              <div className="form-static">{product.name}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Unit Amount (in cents) *</label>
              <input
                type="number"
                className="form-input"
                value={unitAmount}
                onChange={(e) => setUnitAmount(e.target.value)}
                placeholder="e.g., 1999 for $19.99"
                min="1"
              />
              <div className="form-hint">Display: {priceDisplay}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Currency</label>
              <select
                className="form-input"
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

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Billing Interval</label>
                <select
                  className="form-input"
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Every X intervals</label>
                <input
                  type="number"
                  className="form-input"
                  value={intervalCount}
                  onChange={(e) => setIntervalCount(e.target.value)}
                  min="1"
                />
              </div>
            </div>

            <div className="form-hint" style={{ marginTop: '8px' }}>
              Example: "Every 1 month" = monthly, "Every 3 months" = quarterly
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending || !unitAmount}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Price'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
