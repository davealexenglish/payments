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
  id: number
  first_name: string
  last_name: string
  email: string
  organization?: string
  reference?: string
  created_at?: string
}

export interface Subscription {
  id: number
  state: string
  customer?: Customer
  product?: Product
  current_period_ends_at?: string
  activated_at?: string
  created_at?: string
}

export interface Product {
  id: number
  name: string
  handle?: string
  description?: string
  price_in_cents: number
  interval: number
  interval_unit: string
  product_family?: ProductFamily
}

export interface ProductFamily {
  id: number
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
  api_key: string
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

export const updateMaxioCustomer = async (connectionId: number, customerId: number, req: CreateCustomerRequest): Promise<Customer> => {
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

export const listMaxioProductsByFamily = async (connectionId: number, familyId: number): Promise<Product[]> => {
  const response = await api.get(`/api/maxio/${connectionId}/product-families/${familyId}/products`)
  return response.data || []
}

export const createMaxioProduct = async (connectionId: number, familyId: number, req: CreateProductRequest): Promise<Product> => {
  const response = await api.post(`/api/maxio/${connectionId}/product-families/${familyId}/products`, req)
  return response.data
}

export const getMaxioProduct = async (connectionId: number, productId: number): Promise<Product> => {
  const response = await api.get(`/api/maxio/${connectionId}/products/${productId}`)
  return response.data
}

export const updateMaxioProduct = async (connectionId: number, productId: number, req: CreateProductRequest): Promise<Product> => {
  const response = await api.put(`/api/maxio/${connectionId}/products/${productId}`, req)
  return response.data
}

export const listMaxioInvoices = async (connectionId: number): Promise<Invoice[]> => {
  const response = await api.get(`/api/maxio/${connectionId}/invoices`)
  return response.data || []
}

export default {
  listConnections,
  createConnection,
  testConnection,
  deleteConnection,
  getTree,
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
}
