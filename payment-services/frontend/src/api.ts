import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.PROD ? '' : 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types
export interface PlatformConnection {
  id: number
  platform_type: 'maxio' | 'zuora' | 'stripe'
  name: string
  subdomain?: string
  is_sandbox: boolean
  status: 'pending' | 'connected' | 'error'
  error_message?: string
  last_sync_at?: string
  created_at: string
  updated_at: string
}

export interface TreeNode {
  id: string
  type: string
  name: string
  connection_id?: number
  platform_type?: string
  children?: TreeNode[]
  is_expandable: boolean
  data?: unknown
}

export interface Customer {
  id: string
  first_name: string
  last_name: string
  email: string
  organization?: string
  reference?: string
  created_at?: string
}

export interface Subscription {
  id: string
  state: string
  customer?: Customer
  product?: Product
  current_period_ends_at?: string
  activated_at?: string
  created_at?: string
}

export interface Product {
  id: string
  name: string
  handle?: string
  description?: string
  price_in_cents: number
  interval: number
  interval_unit: string
  product_family?: ProductFamily
}

export interface ProductFamily {
  id: string
  name: string
  handle?: string
  description?: string
  created_at?: string
}

export interface Invoice {
  uid: string
  number: string
  customer_id: number
  status: string
  total_amount?: string
  due_date?: string
  created_at?: string
}

export interface CreateConnectionRequest {
  platform_type: 'maxio' | 'zuora' | 'stripe'
  name: string
  subdomain?: string
  api_key?: string       // Used by Maxio, Stripe
  client_id?: string     // Used by Zuora
  client_secret?: string // Used by Zuora
  is_sandbox: boolean
}

export interface CreateCustomerRequest {
  first_name: string
  last_name: string
  email: string
  organization?: string
  reference?: string
}

export interface CreditCardInput {
  full_number: string
  expiration_month: number
  expiration_year: number
  cvv?: string
}

export interface CreateSubscriptionRequest {
  customer_id: number
  product_id?: number
  product_handle?: string
  coupon_code?: string
  reference?: string
  payment_collection_method?: 'automatic' | 'invoice'
  credit_card_attributes?: CreditCardInput
}

export interface CreateProductFamilyRequest {
  name: string
  handle?: string
  description?: string
}

export interface CreateProductRequest {
  name: string
  handle?: string
  description?: string
  price_in_cents: number
  interval: number
  interval_unit: string
}

// Connection APIs
export const listConnections = async (): Promise<PlatformConnection[]> => {
  const response = await api.get('/api/connections')
  return response.data || []
}

export const createConnection = async (req: CreateConnectionRequest): Promise<PlatformConnection> => {
  const response = await api.post('/api/connections', req)
  return response.data
}

export const testConnection = async (id: number): Promise<{ status: string }> => {
  const response = await api.post(`/api/connections/${id}/test`)
  return response.data
}

export const deleteConnection = async (id: number): Promise<void> => {
  await api.delete(`/api/connections/${id}`)
}

// Tree API
export const getTree = async (): Promise<TreeNode[]> => {
  const response = await api.get('/api/tree')
  return response.data || []
}

// Maxio APIs
export const listMaxioCustomers = async (connectionId: number): Promise<Customer[]> => {
  const response = await api.get(`/api/maxio/${connectionId}/customers`)
  return response.data || []
}

export const createMaxioCustomer = async (connectionId: number, req: CreateCustomerRequest): Promise<Customer> => {
  const response = await api.post(`/api/maxio/${connectionId}/customers`, req)
  return response.data
}

export const getMaxioCustomer = async (connectionId: number, customerId: string): Promise<Customer> => {
  const response = await api.get(`/api/maxio/${connectionId}/customers/${customerId}`)
  return response.data
}

export const updateMaxioCustomer = async (connectionId: number, customerId: string, req: CreateCustomerRequest): Promise<Customer> => {
  const response = await api.put(`/api/maxio/${connectionId}/customers/${customerId}`, req)
  return response.data
}

export const listMaxioSubscriptions = async (connectionId: number): Promise<Subscription[]> => {
  const response = await api.get(`/api/maxio/${connectionId}/subscriptions`)
  return response.data || []
}

export const createMaxioSubscription = async (connectionId: number, req: CreateSubscriptionRequest): Promise<Subscription> => {
  const response = await api.post(`/api/maxio/${connectionId}/subscriptions`, req)
  return response.data
}

export const listMaxioProducts = async (connectionId: number): Promise<Product[]> => {
  const response = await api.get(`/api/maxio/${connectionId}/products`)
  return response.data || []
}

export const listMaxioProductFamilies = async (connectionId: number): Promise<ProductFamily[]> => {
  const response = await api.get(`/api/maxio/${connectionId}/product-families`)
  return response.data || []
}

export const createMaxioProductFamily = async (connectionId: number, req: CreateProductFamilyRequest): Promise<ProductFamily> => {
  const response = await api.post(`/api/maxio/${connectionId}/product-families`, req)
  return response.data
}

export const listMaxioProductsByFamily = async (connectionId: number, familyId: string): Promise<Product[]> => {
  const response = await api.get(`/api/maxio/${connectionId}/product-families/${familyId}/products`)
  return response.data || []
}

export const createMaxioProduct = async (connectionId: number, familyId: string, req: CreateProductRequest): Promise<Product> => {
  const response = await api.post(`/api/maxio/${connectionId}/product-families/${familyId}/products`, req)
  return response.data
}

export const getMaxioProduct = async (connectionId: number, productId: string): Promise<Product> => {
  const response = await api.get(`/api/maxio/${connectionId}/products/${productId}`)
  return response.data
}

export const updateMaxioProduct = async (connectionId: number, productId: string, req: CreateProductRequest): Promise<Product> => {
  const response = await api.put(`/api/maxio/${connectionId}/products/${productId}`, req)
  return response.data
}

export const listMaxioInvoices = async (connectionId: number): Promise<Invoice[]> => {
  const response = await api.get(`/api/maxio/${connectionId}/invoices`)
  return response.data || []
}

// Zuora APIs
// Note: Zuora uses "Account" instead of "Customer", but we map to the same frontend types
export const listZuoraAccounts = async (connectionId: number): Promise<Customer[]> => {
  const response = await api.get(`/api/zuora/${connectionId}/accounts`)
  return response.data || []
}

export const createZuoraAccount = async (connectionId: number, req: CreateCustomerRequest): Promise<Customer> => {
  const response = await api.post(`/api/zuora/${connectionId}/accounts`, req)
  return response.data
}

export const getZuoraAccount = async (connectionId: number, accountId: string): Promise<Customer> => {
  const response = await api.get(`/api/zuora/${connectionId}/accounts/${accountId}`)
  return response.data
}

export const listZuoraSubscriptions = async (connectionId: number): Promise<Subscription[]> => {
  const response = await api.get(`/api/zuora/${connectionId}/subscriptions`)
  return response.data || []
}

export const createZuoraSubscription = async (connectionId: number, req: CreateSubscriptionRequest): Promise<Subscription> => {
  const response = await api.post(`/api/zuora/${connectionId}/subscriptions`, req)
  return response.data
}

// Zuora uses Product Catalog instead of Product Families
export const listZuoraProductCatalogs = async (connectionId: number): Promise<ProductFamily[]> => {
  const response = await api.get(`/api/zuora/${connectionId}/products`)
  return response.data || []
}

export const listZuoraProductsByRatePlan = async (connectionId: number, productId: string): Promise<Product[]> => {
  const response = await api.get(`/api/zuora/${connectionId}/products/${productId}/rate-plans`)
  return response.data || []
}

export const listZuoraInvoices = async (connectionId: number): Promise<Invoice[]> => {
  const response = await api.get(`/api/zuora/${connectionId}/invoices`)
  return response.data || []
}

// Stripe APIs
export const listStripeCustomers = async (connectionId: number): Promise<Customer[]> => {
  const response = await api.get(`/api/stripe/${connectionId}/customers`)
  // Map Stripe customer format to our Customer interface
  return (response.data || []).map((c: { id: string; name?: string; email?: string; created?: number }) => ({
    id: c.id,
    first_name: c.name?.split(' ')[0] || '',
    last_name: c.name?.split(' ').slice(1).join(' ') || '',
    email: c.email || '',
    created_at: c.created ? new Date(c.created * 1000).toISOString() : undefined,
  }))
}

export const createStripeCustomer = async (connectionId: number, req: CreateCustomerRequest): Promise<Customer> => {
  const stripeReq = {
    name: `${req.first_name} ${req.last_name}`.trim(),
    email: req.email,
    description: req.organization,
  }
  const response = await api.post(`/api/stripe/${connectionId}/customers`, stripeReq)
  const c = response.data
  return {
    id: c.id,
    first_name: c.name?.split(' ')[0] || '',
    last_name: c.name?.split(' ').slice(1).join(' ') || '',
    email: c.email || '',
  }
}

export const updateStripeCustomer = async (connectionId: number, customerId: string, req: CreateCustomerRequest): Promise<Customer> => {
  const stripeReq = {
    name: `${req.first_name} ${req.last_name}`.trim(),
    email: req.email,
    description: req.organization,
  }
  const response = await api.put(`/api/stripe/${connectionId}/customers/${customerId}`, stripeReq)
  const c = response.data
  return {
    id: c.id,
    first_name: c.name?.split(' ')[0] || '',
    last_name: c.name?.split(' ').slice(1).join(' ') || '',
    email: c.email || '',
  }
}

export const createStripeProduct = async (connectionId: number, req: { name: string; description?: string }): Promise<ProductFamily> => {
  const response = await api.post(`/api/stripe/${connectionId}/products`, req)
  const p = response.data
  return {
    id: p.id,
    name: p.name,
    description: p.description,
  }
}

export const listStripeSubscriptions = async (connectionId: number): Promise<Subscription[]> => {
  const response = await api.get(`/api/stripe/${connectionId}/subscriptions`)
  return (response.data || []).map((s: { id: string; status: string; created?: number }) => ({
    id: s.id,
    state: s.status,
    created_at: s.created ? new Date(s.created * 1000).toISOString() : undefined,
  }))
}

export const createStripeSubscription = async (
  connectionId: number,
  customerId: string,
  priceId: string
): Promise<Subscription> => {
  const response = await api.post(`/api/stripe/${connectionId}/subscriptions`, {
    customer_id: customerId,
    price_id: priceId,
  })
  const s = response.data
  return {
    id: s.id,
    state: s.status,
    created_at: s.created ? new Date(s.created * 1000).toISOString() : undefined,
  }
}

export const listStripeProducts = async (connectionId: number): Promise<ProductFamily[]> => {
  const response = await api.get(`/api/stripe/${connectionId}/products`)
  // Map Stripe products to ProductFamily (products are top-level in Stripe)
  return (response.data || []).map((p: { id: string; name: string; description?: string; created?: number }) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    created_at: p.created ? new Date(p.created * 1000).toISOString() : undefined,
  }))
}

export const listStripePrices = async (connectionId: number, productId: string): Promise<Product[]> => {
  const response = await api.get(`/api/stripe/${connectionId}/prices?product=${productId}`)
  return (response.data || []).map((p: { id: string; unit_amount: number; currency: string; recurring?: { interval: string; interval_count: number } }) => ({
    id: p.id,
    name: `${p.currency.toUpperCase()} ${(p.unit_amount / 100).toFixed(2)}${p.recurring ? ` / ${p.recurring.interval}` : ''}`,
    price_in_cents: p.unit_amount,
    interval: p.recurring?.interval_count || 1,
    interval_unit: p.recurring?.interval || 'one_time',
  }))
}

export const createStripePrice = async (
  connectionId: number,
  productId: string,
  req: { price_in_cents: number; interval: number; interval_unit: string }
): Promise<Product> => {
  const response = await api.post(`/api/stripe/${connectionId}/prices`, {
    product_id: productId,
    unit_amount: req.price_in_cents,
    currency: 'usd',
    interval: req.interval_unit,
    interval_count: req.interval,
  })
  const p = response.data
  return {
    id: p.id,
    name: `USD ${(p.unit_amount / 100).toFixed(2)}${p.recurring ? ` / ${p.recurring.interval}` : ''}`,
    price_in_cents: p.unit_amount,
    interval: p.recurring?.interval_count || 1,
    interval_unit: p.recurring?.interval || 'one_time',
  }
}

export const listStripeInvoices = async (connectionId: number): Promise<Invoice[]> => {
  const response = await api.get(`/api/stripe/${connectionId}/invoices`)
  return (response.data || []).map((i: { id: string; number?: string; customer: string; status: string; total: number; due_date?: number; created?: number }) => ({
    uid: i.id,
    number: i.number || i.id,
    customer_id: i.customer,
    status: i.status,
    total_amount: String(i.total / 100),
    due_date: i.due_date ? new Date(i.due_date * 1000).toISOString() : undefined,
    created_at: i.created ? new Date(i.created * 1000).toISOString() : undefined,
  }))
}

export default {
  listConnections,
  createConnection,
  testConnection,
  deleteConnection,
  getTree,
  // Maxio
  listMaxioCustomers,
  createMaxioCustomer,
  getMaxioCustomer,
  updateMaxioCustomer,
  listMaxioSubscriptions,
  createMaxioSubscription,
  listMaxioProducts,
  listMaxioProductFamilies,
  createMaxioProductFamily,
  listMaxioProductsByFamily,
  createMaxioProduct,
  getMaxioProduct,
  updateMaxioProduct,
  listMaxioInvoices,
  // Zuora
  listZuoraAccounts,
  createZuoraAccount,
  getZuoraAccount,
  listZuoraSubscriptions,
  createZuoraSubscription,
  listZuoraProductCatalogs,
  listZuoraProductsByRatePlan,
  listZuoraInvoices,
  // Stripe
  listStripeCustomers,
  createStripeCustomer,
  updateStripeCustomer,
  listStripeSubscriptions,
  listStripeProducts,
  createStripeProduct,
  listStripePrices,
  listStripeInvoices,
}
