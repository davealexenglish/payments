import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  getStripeSubscription,
  updateStripeSubscription,
  cancelStripeSubscription,
  listStripeCoupons,
  type StripeSubscriptionUpdateRequest,
  type StripeCoupon,
} from '../../../api'
import { useToast } from '../../Toast'
import { useConfirm } from '../../ConfirmDialog'

interface EditStripeSubscriptionDialogProps {
  connectionId: number
  subscriptionId: string
  onClose: () => void
  onSuccess: () => void
}

/**
 * Stripe Subscription edit dialog
 * Maps to: POST /v1/subscriptions/{id}
 * https://docs.stripe.com/api/subscriptions/update
 *
 * Mutable fields: cancel_at_period_end, collection_method, days_until_due,
 *                 description, coupon, default_payment_method, metadata
 * Read-only fields: id, customer, status, current_period, items, created
 */
export function EditStripeSubscriptionDialog({ connectionId, subscriptionId, onClose, onSuccess }: EditStripeSubscriptionDialogProps) {
  // Mutable fields
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false)
  const [collectionMethod, setCollectionMethod] = useState<'charge_automatically' | 'send_invoice'>('charge_automatically')
  const [daysUntilDue, setDaysUntilDue] = useState('30')
  const [description, setDescription] = useState('')
  const [coupon, setCoupon] = useState('')

  const { showToast } = useToast()
  const confirm = useConfirm()

  // Fetch current subscription data
  const { data: subscription, isLoading: loadingSubscription } = useQuery({
    queryKey: ['stripe', 'subscription', connectionId, subscriptionId],
    queryFn: () => getStripeSubscription(connectionId, subscriptionId),
  })

  // Fetch available coupons
  const { data: coupons } = useQuery({
    queryKey: ['stripe', 'coupons', connectionId],
    queryFn: () => listStripeCoupons(connectionId),
  })

  // Initialize form with current values when subscription loads
  useEffect(() => {
    if (subscription) {
      setCancelAtPeriodEnd(subscription.cancel_at_period_end)
      // Note: collection_method and description need to be fetched from the full subscription
      // For now we use defaults as these aren't returned in the list endpoint
    }
  }, [subscription])

  const updateMutation = useMutation({
    mutationFn: () => {
      const req: StripeSubscriptionUpdateRequest = {
        cancel_at_period_end: cancelAtPeriodEnd,
        collection_method: collectionMethod,
        description: description.trim() || undefined,
      }

      if (collectionMethod === 'send_invoice') {
        req.days_until_due = parseInt(daysUntilDue, 10) || 30
      }

      if (coupon) {
        req.coupon = coupon
      }

      return updateStripeSubscription(connectionId, subscriptionId, req)
    },
    onSuccess: () => {
      showToast('Subscription updated successfully', 'success')
      onSuccess()
    },
    onError: (err) => {
      showToast(err, 'error')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (atPeriodEnd: boolean) => {
      return cancelStripeSubscription(connectionId, subscriptionId, atPeriodEnd)
    },
    onSuccess: () => {
      showToast('Subscription canceled successfully', 'success')
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

  const handleCancel = async (atPeriodEnd: boolean) => {
    const confirmed = await confirm({
      title: atPeriodEnd ? 'Cancel at Period End' : 'Cancel Subscription',
      message: atPeriodEnd
        ? 'Cancel subscription at the end of the current billing period?'
        : 'Cancel subscription immediately? This cannot be undone.',
      confirmLabel: atPeriodEnd ? 'Cancel at Period End' : 'Cancel Now',
      danger: !atPeriodEnd,
    })

    if (confirmed) {
      cancelMutation.mutate(atPeriodEnd)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const formatPrice = (item: NonNullable<NonNullable<typeof subscription>['items']>['data'][0]) => {
    if (!item.price) return 'Unknown price'
    const amount = (item.price.unit_amount / 100).toFixed(2)
    const currency = item.price.currency.toUpperCase()
    const interval = item.price.recurring
      ? ` / ${item.price.recurring.interval}`
      : ''
    return `${currency} ${amount}${interval} x ${item.quantity}`
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

  const readOnlyStyle: React.CSSProperties = {
    fontSize: '13px',
    padding: '6px 0',
    color: 'var(--text-primary)',
    fontFamily: 'monospace',
  }

  const statusColors: Record<string, string> = {
    active: '#22c55e',
    past_due: '#f59e0b',
    canceled: '#ef4444',
    incomplete: '#6b7280',
    trialing: '#3b82f6',
    unpaid: '#ef4444',
  }

  if (loadingSubscription) {
    return (
      <div className="modal-overlay">
        <div className="modal-dialog" style={{ maxWidth: '500px' }}>
          <div className="modal-body" style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            Loading subscription...
          </div>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="modal-overlay">
        <div className="modal-dialog" style={{ maxWidth: '500px' }}>
          <div className="modal-header">
            Error
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body" style={{ padding: '20px' }}>
            Failed to load subscription details.
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    )
  }

  const isCanceled = subscription.status === 'canceled'

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          Edit Stripe Subscription
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '12px 16px' }}>
            {/* Read-only section */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Subscription Info (Read-only)
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>ID</label>
                <div style={{ ...inputContainerStyle, ...readOnlyStyle }}>{subscription.id}</div>
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Status</label>
                <div style={inputContainerStyle}>
                  <span style={{
                    ...readOnlyStyle,
                    color: statusColors[subscription.status] || 'inherit',
                    fontWeight: 600,
                  }}>
                    {subscription.status.toUpperCase()}
                    {subscription.cancel_at_period_end && ' (cancels at period end)'}
                  </span>
                </div>
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Customer</label>
                <div style={{ ...inputContainerStyle, ...readOnlyStyle }}>{subscription.customer}</div>
              </div>

              <div style={rowStyle}>
                <label style={labelStyle}>Current Period</label>
                <div style={{ ...inputContainerStyle, ...readOnlyStyle }}>
                  {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                </div>
              </div>

              {subscription.items?.data.map((item, idx) => (
                <div key={item.id} style={rowStyle}>
                  <label style={labelStyle}>{idx === 0 ? 'Items' : ''}</label>
                  <div style={{ ...inputContainerStyle, ...readOnlyStyle, fontSize: '12px' }}>
                    {formatPrice(item)}
                  </div>
                </div>
              ))}

              <div style={rowStyle}>
                <label style={labelStyle}>Created</label>
                <div style={{ ...inputContainerStyle, ...readOnlyStyle }}>{formatDate(subscription.created)}</div>
              </div>
            </div>

            {/* Editable section */}
            {!isCanceled && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Editable Fields
                </div>

                <div style={rowStyle}>
                  <label style={labelStyle}>Cancel at Period End</label>
                  <div style={inputContainerStyle}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={cancelAtPeriodEnd}
                        onChange={(e) => setCancelAtPeriodEnd(e.target.checked)}
                      />
                      <span style={{ fontSize: '13px' }}>Auto-cancel after current period</span>
                    </label>
                  </div>
                </div>

                <div style={rowStyle}>
                  <label style={labelStyle}>Collection Method</label>
                  <div style={inputContainerStyle}>
                    <select
                      className="form-input"
                      style={{ fontSize: '13px', padding: '6px 8px' }}
                      value={collectionMethod}
                      onChange={(e) => setCollectionMethod(e.target.value as 'charge_automatically' | 'send_invoice')}
                    >
                      <option value="charge_automatically">Charge automatically</option>
                      <option value="send_invoice">Send invoice</option>
                    </select>
                  </div>
                </div>

                {collectionMethod === 'send_invoice' && (
                  <div style={rowStyle}>
                    <label style={labelStyle}>Days Until Due</label>
                    <div style={inputContainerStyle}>
                      <input
                        type="number"
                        className="form-input"
                        style={{ fontSize: '13px', padding: '6px 8px', width: '80px' }}
                        value={daysUntilDue}
                        onChange={(e) => setDaysUntilDue(e.target.value)}
                        min="1"
                      />
                    </div>
                  </div>
                )}

                <div style={rowStyle}>
                  <label style={labelStyle}>Apply Coupon</label>
                  <div style={inputContainerStyle}>
                    <select
                      className="form-input"
                      style={{ fontSize: '13px', padding: '6px 8px' }}
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                    >
                      <option value="">No coupon</option>
                      {coupons?.map((c: StripeCoupon) => (
                        <option key={c.id} value={c.id}>
                          {c.name || c.id} - {c.percent_off ? `${c.percent_off}% off` : `$${((c.amount_off || 0) / 100).toFixed(2)} off`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={rowStyle}>
                  <label style={labelStyle}>Description</label>
                  <div style={inputContainerStyle}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: '13px', padding: '6px 8px' }}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Internal note"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cancel actions */}
            {!isCanceled && (
              <div style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '12px',
                marginTop: '12px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Cancel Subscription
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: '12px' }}
                    onClick={() => handleCancel(true)}
                    disabled={cancelMutation.isPending}
                  >
                    Cancel at Period End
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ fontSize: '12px', backgroundColor: 'var(--error-color)', color: 'white' }}
                    onClick={() => handleCancel(false)}
                    disabled={cancelMutation.isPending}
                  >
                    Cancel Immediately
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer" style={{ padding: '12px 16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            {!isCanceled && (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
