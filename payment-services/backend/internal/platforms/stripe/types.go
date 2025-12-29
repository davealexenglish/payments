package stripe

import "time"

// Customer represents a Stripe customer
type Customer struct {
	ID          string            `json:"id"`
	Object      string            `json:"object"`
	Name        string            `json:"name,omitempty"`
	Email       string            `json:"email,omitempty"`
	Phone       string            `json:"phone,omitempty"`
	Description string            `json:"description,omitempty"`
	Created     int64             `json:"created"`
	Metadata    map[string]string `json:"metadata,omitempty"`
	Address     *Address          `json:"address,omitempty"`
	Currency    string            `json:"currency,omitempty"`
	Delinquent  bool              `json:"delinquent"`
	Livemode    bool              `json:"livemode"`
}

// CreatedTime returns the created timestamp as time.Time
func (c *Customer) CreatedTime() time.Time {
	return time.Unix(c.Created, 0)
}

// Address represents a Stripe address
type Address struct {
	Line1      string `json:"line1,omitempty"`
	Line2      string `json:"line2,omitempty"`
	City       string `json:"city,omitempty"`
	State      string `json:"state,omitempty"`
	PostalCode string `json:"postal_code,omitempty"`
	Country    string `json:"country,omitempty"`
}

// CustomerInput is the input for creating/updating a customer
type CustomerInput struct {
	Name        string            `json:"name,omitempty"`
	Email       string            `json:"email,omitempty"`
	Phone       string            `json:"phone,omitempty"`
	Description string            `json:"description,omitempty"`
	Metadata    map[string]string `json:"metadata,omitempty"`
	Address     *Address          `json:"address,omitempty"`
}

// CustomerList is the response for listing customers
type CustomerList struct {
	Object  string     `json:"object"`
	URL     string     `json:"url"`
	HasMore bool       `json:"has_more"`
	Data    []Customer `json:"data"`
}

// Subscription represents a Stripe subscription
type Subscription struct {
	ID                   string `json:"id"`
	Object               string `json:"object"`
	Customer             string `json:"customer"`
	Status               string `json:"status"`
	Currency             string `json:"currency,omitempty"`
	CurrentPeriodStart   int64  `json:"current_period_start"`
	CurrentPeriodEnd     int64  `json:"current_period_end"`
	CancelAtPeriodEnd    bool   `json:"cancel_at_period_end"`
	CanceledAt           *int64 `json:"canceled_at,omitempty"`
	Created              int64  `json:"created"`
	StartDate            int64  `json:"start_date"`
	EndedAt              *int64 `json:"ended_at,omitempty"`
	TrialStart           *int64 `json:"trial_start,omitempty"`
	TrialEnd             *int64 `json:"trial_end,omitempty"`
	Livemode             bool   `json:"livemode"`
	Items                *Items `json:"items,omitempty"`
	LatestInvoice        string `json:"latest_invoice,omitempty"`
	DefaultPaymentMethod string `json:"default_payment_method,omitempty"`
}

// Items represents subscription items
type Items struct {
	Object  string             `json:"object"`
	URL     string             `json:"url"`
	HasMore bool               `json:"has_more"`
	Data    []SubscriptionItem `json:"data"`
}

// SubscriptionItem represents a subscription item
type SubscriptionItem struct {
	ID       string `json:"id"`
	Object   string `json:"object"`
	Price    *Price `json:"price,omitempty"`
	Quantity int64  `json:"quantity"`
}

// SubscriptionList is the response for listing subscriptions
type SubscriptionList struct {
	Object  string         `json:"object"`
	URL     string         `json:"url"`
	HasMore bool           `json:"has_more"`
	Data    []Subscription `json:"data"`
}

// SubscriptionInput is the input for creating a subscription
// Maps to POST /v1/subscriptions - https://docs.stripe.com/api/subscriptions/create
type SubscriptionInput struct {
	CustomerID           string            `json:"customer_id"`
	PriceID              string            `json:"price_id"`
	Quantity             int               `json:"quantity,omitempty"`
	CollectionMethod     string            `json:"collection_method,omitempty"`      // charge_automatically (default) or send_invoice
	PaymentBehavior      string            `json:"payment_behavior,omitempty"`       // default_incomplete, error_if_incomplete, allow_incomplete, pending_if_incomplete
	DaysUntilDue         int               `json:"days_until_due,omitempty"`         // Required if collection_method=send_invoice
	TrialPeriodDays      int               `json:"trial_period_days,omitempty"`      // Number of trial days
	Coupon               string            `json:"coupon,omitempty"`                 // Coupon code
	Description          string            `json:"description,omitempty"`            // Internal description
	CancelAtPeriodEnd    bool              `json:"cancel_at_period_end,omitempty"`   // Cancel at end of period
	BillingCycleAnchor   int64             `json:"billing_cycle_anchor,omitempty"`   // Unix timestamp for billing cycle
	DefaultPaymentMethod string            `json:"default_payment_method,omitempty"` // Payment method ID
	Metadata             map[string]string `json:"metadata,omitempty"`
}

// Product represents a Stripe product
type Product struct {
	ID          string            `json:"id"`
	Object      string            `json:"object"`
	Name        string            `json:"name"`
	Description string            `json:"description,omitempty"`
	Active      bool              `json:"active"`
	Created     int64             `json:"created"`
	Updated     int64             `json:"updated"`
	Metadata    map[string]string `json:"metadata,omitempty"`
	Livemode    bool              `json:"livemode"`
	Images      []string          `json:"images,omitempty"`
	URL         string            `json:"url,omitempty"`
}

// ProductList is the response for listing products
type ProductList struct {
	Object  string    `json:"object"`
	URL     string    `json:"url"`
	HasMore bool      `json:"has_more"`
	Data    []Product `json:"data"`
}

// Price represents a Stripe price
type Price struct {
	ID            string     `json:"id"`
	Object        string     `json:"object"`
	Active        bool       `json:"active"`
	Currency      string     `json:"currency"`
	Product       string     `json:"product"`
	UnitAmount    int64      `json:"unit_amount"`
	BillingScheme string     `json:"billing_scheme"`
	Created       int64      `json:"created"`
	Livemode      bool       `json:"livemode"`
	Type          string     `json:"type"`
	Recurring     *Recurring `json:"recurring,omitempty"`
}

// Recurring represents recurring pricing details
type Recurring struct {
	Interval      string `json:"interval"`
	IntervalCount int    `json:"interval_count"`
}

// PriceList is the response for listing prices
type PriceList struct {
	Object  string  `json:"object"`
	URL     string  `json:"url"`
	HasMore bool    `json:"has_more"`
	Data    []Price `json:"data"`
}

// Invoice represents a Stripe invoice
type Invoice struct {
	ID               string `json:"id"`
	Object           string `json:"object"`
	Customer         string `json:"customer"`
	Subscription     string `json:"subscription,omitempty"`
	Status           string `json:"status"`
	Currency         string `json:"currency"`
	AmountDue        int64  `json:"amount_due"`
	AmountPaid       int64  `json:"amount_paid"`
	AmountRemaining  int64  `json:"amount_remaining"`
	Total            int64  `json:"total"`
	Subtotal         int64  `json:"subtotal"`
	Tax              int64  `json:"tax,omitempty"`
	Created          int64  `json:"created"`
	DueDate          *int64 `json:"due_date,omitempty"`
	PeriodStart      int64  `json:"period_start"`
	PeriodEnd        int64  `json:"period_end"`
	Paid             bool   `json:"paid"`
	Number           string `json:"number,omitempty"`
	InvoicePDF       string `json:"invoice_pdf,omitempty"`
	HostedInvoiceURL string `json:"hosted_invoice_url,omitempty"`
	Livemode         bool   `json:"livemode"`
}

// InvoiceList is the response for listing invoices
type InvoiceList struct {
	Object  string    `json:"object"`
	URL     string    `json:"url"`
	HasMore bool      `json:"has_more"`
	Data    []Invoice `json:"data"`
}

// PaymentIntent represents a Stripe payment intent
type PaymentIntent struct {
	ID            string `json:"id"`
	Object        string `json:"object"`
	Amount        int64  `json:"amount"`
	Currency      string `json:"currency"`
	Status        string `json:"status"`
	Customer      string `json:"customer,omitempty"`
	Description   string `json:"description,omitempty"`
	Created       int64  `json:"created"`
	Livemode      bool   `json:"livemode"`
	PaymentMethod string `json:"payment_method,omitempty"`
	ReceiptEmail  string `json:"receipt_email,omitempty"`
}

// PaymentIntentList is the response for listing payment intents
type PaymentIntentList struct {
	Object  string          `json:"object"`
	URL     string          `json:"url"`
	HasMore bool            `json:"has_more"`
	Data    []PaymentIntent `json:"data"`
}

// Charge represents a Stripe charge
type Charge struct {
	ID             string `json:"id"`
	Object         string `json:"object"`
	Amount         int64  `json:"amount"`
	AmountRefunded int64  `json:"amount_refunded"`
	Currency       string `json:"currency"`
	Customer       string `json:"customer,omitempty"`
	Description    string `json:"description,omitempty"`
	Status         string `json:"status"`
	Paid           bool   `json:"paid"`
	Refunded       bool   `json:"refunded"`
	Created        int64  `json:"created"`
	Livemode       bool   `json:"livemode"`
	PaymentIntent  string `json:"payment_intent,omitempty"`
	PaymentMethod  string `json:"payment_method,omitempty"`
	ReceiptURL     string `json:"receipt_url,omitempty"`
}

// ChargeList is the response for listing charges
type ChargeList struct {
	Object  string   `json:"object"`
	URL     string   `json:"url"`
	HasMore bool     `json:"has_more"`
	Data    []Charge `json:"data"`
}

// Coupon represents a Stripe coupon
// https://docs.stripe.com/api/coupons
type Coupon struct {
	ID               string            `json:"id"`
	Object           string            `json:"object"`
	AmountOff        *int64            `json:"amount_off,omitempty"`
	Currency         string            `json:"currency,omitempty"`
	Duration         string            `json:"duration"` // once, repeating, forever
	DurationInMonths *int              `json:"duration_in_months,omitempty"`
	MaxRedemptions   *int              `json:"max_redemptions,omitempty"`
	Name             string            `json:"name,omitempty"`
	PercentOff       *float64          `json:"percent_off,omitempty"`
	RedeemBy         *int64            `json:"redeem_by,omitempty"`
	TimesRedeemed    int               `json:"times_redeemed"`
	Valid            bool              `json:"valid"`
	Created          int64             `json:"created"`
	Livemode         bool              `json:"livemode"`
	Metadata         map[string]string `json:"metadata,omitempty"`
}

// CouponList is the response for listing coupons
type CouponList struct {
	Object  string   `json:"object"`
	URL     string   `json:"url"`
	HasMore bool     `json:"has_more"`
	Data    []Coupon `json:"data"`
}

// CouponInput is the input for creating/updating a coupon
type CouponInput struct {
	ID               string  `json:"id,omitempty"`                 // Custom ID (optional on create)
	AmountOff        int64   `json:"amount_off,omitempty"`         // Amount in cents
	Currency         string  `json:"currency,omitempty"`           // Required if amount_off
	Duration         string  `json:"duration"`                     // once, repeating, forever
	DurationInMonths int     `json:"duration_in_months,omitempty"` // Required if duration=repeating
	MaxRedemptions   int     `json:"max_redemptions,omitempty"`
	Name             string  `json:"name,omitempty"`
	PercentOff       float64 `json:"percent_off,omitempty"` // 0-100
	RedeemBy         int64   `json:"redeem_by,omitempty"`   // Unix timestamp
}

// APIError represents a Stripe API error
type APIError struct {
	StatusCode int
	Type       string `json:"type"`
	Message    string `json:"message"`
	Code       string `json:"code,omitempty"`
	Param      string `json:"param,omitempty"`
}

func (e *APIError) Error() string {
	return e.Message
}

// NewAPIError creates a new API error
func NewAPIError(statusCode int, message string) *APIError {
	return &APIError{StatusCode: statusCode, Message: message}
}

// ErrorResponse is the error response from Stripe API
type ErrorResponse struct {
	Error APIError `json:"error"`
}
