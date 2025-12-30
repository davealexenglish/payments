import { Tag, Plus, RefreshCw, Trash2, Pencil } from 'lucide-react'
import { createContainerNodeHandler, createLeafNodeHandler } from './BaseNode'
import type { MenuItem, NodeContext, TreeNodeData } from './types'
import type { StripeCoupon } from '../../api'

// Coupons container node
export const CouponsNode = createContainerNodeHandler({
  icon: (size) => <Tag size={size} />,

  getTypeSpecificMenuItems: (context: NodeContext): MenuItem[] => {
    const items: MenuItem[] = []
    const { connectionId, platformType, refreshQuery, onCreateCoupon } = context

    if (connectionId && platformType === 'stripe' && onCreateCoupon) {
      items.push({
        label: 'Create Coupon',
        icon: <Plus size={14} />,
        action: () => onCreateCoupon(connectionId),
      })
    }

    if (connectionId && platformType) {
      items.push({
        label: 'Refresh',
        icon: <RefreshCw size={14} />,
        action: () => refreshQuery([platformType, 'coupons', String(connectionId)]),
      })
    }

    return items
  },
})

// Individual coupon node
export const CouponNode = createLeafNodeHandler({
  icon: (size) => <Tag size={size} />,

  getDisplayName: (node: TreeNodeData): string => {
    if (node.data) {
      const coupon = node.data as StripeCoupon
      const discount = coupon.percent_off
        ? `${coupon.percent_off}% off`
        : coupon.amount_off
          ? `$${(coupon.amount_off / 100).toFixed(2)} off`
          : ''
      const name = coupon.name || coupon.id
      return discount ? `${name} (${discount})` : name
    }
    return node.name
  },

  getTypeSpecificMenuItems: (context: NodeContext): MenuItem[] => {
    const items: MenuItem[] = []
    const { node, connectionId, platformType, onEditCoupon, onDeleteCoupon } = context

    if (connectionId && platformType === 'stripe' && node.data) {
      const coupon = node.data as StripeCoupon

      if (onEditCoupon) {
        items.push({
          label: 'Edit Coupon',
          icon: <Pencil size={14} />,
          action: () => onEditCoupon(connectionId, coupon),
        })
      }

      if (onDeleteCoupon) {
        items.push({
          label: 'Delete Coupon',
          icon: <Trash2 size={14} />,
          action: () => onDeleteCoupon(connectionId, coupon.id),
          danger: true,
        })
      }
    }

    return items
  },
})
