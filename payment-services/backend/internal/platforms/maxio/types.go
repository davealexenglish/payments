package maxio

import "time"

// CustomerWrapper is the wrapper for customer responses
type CustomerWrapper struct {
	Customer Customer `json:"customer"`
}

// Customer represents a Maxio customer
type Customer struct {
	ID               int64      `json:"id"`
	FirstName        string     `json:"first_name"`
	LastName         string     `json:"last_name"`
	Email            string     `json:"email"`
	Organization     string     `json:"organization,omitempty"`
	Reference        string     `json:"reference,omitempty"`
	Address          string     `json:"address,omitempty"`
	Address2         string     `json:"address_2,omitempty"`
	City             string     `json:"city,omitempty"`
	State            string     `json:"state,omitempty"`
	Zip              string     `json:"zip,omitempty"`
	Country          string     `json:"country,omitempty"`
	Phone            string     `json:"phone,omitempty"`
	Verified         bool       `json:"verified,omitempty"`
	TaxExempt        bool       `json:"tax_exempt,omitempty"`
	VatNumber        string     `json:"vat_number,omitempty"`
	ParentID         *int64     `json:"parent_id,omitempty"`
	Locale           string     `json:"locale,omitempty"`
	DefaultSubscriptionGroupUID string `json:"default_subscription_group_uid,omitempty"`
	CreatedAt        *time.Time `json:"created_at,omitempty"`
	UpdatedAt        *time.Time `json:"updated_at,omitempty"`
}

// CreateCustomerRequest is the request body for creating a customer
type CreateCustomerRequest struct {
	Customer CustomerInput `json:"customer"`
}

// CustomerInput is the input for creating/updating a customer
type CustomerInput struct {
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	Email        string `json:"email"`
	Organization string `json:"organization,omitempty"`
	Reference    string `json:"reference,omitempty"`
	Address      string `json:"address,omitempty"`
	City         string `json:"city,omitempty"`
	State        string `json:"state,omitempty"`
	Zip          string `json:"zip,omitempty"`
	Country      string `json:"country,omitempty"`
	Phone        string `json:"phone,omitempty"`
}

// SubscriptionWrapper is the wrapper for subscription responses
type SubscriptionWrapper struct {
	Subscription Subscription `json:"subscription"`
}

// Subscription represents a Maxio subscription
type Subscription struct {
	ID                         int64      `json:"id"`
	State                      string     `json:"state"`
	BalanceInCents             int64      `json:"balance_in_cents"`
	TotalRevenueInCents        int64      `json:"total_revenue_in_cents"`
	ProductPriceInCents        int64      `json:"product_price_in_cents"`
	ProductVersionNumber       int        `json:"product_version_number"`
	CurrentPeriodEndsAt        *time.Time `json:"current_period_ends_at"`
	NextAssessmentAt           *time.Time `json:"next_assessment_at"`
	TrialStartedAt             *time.Time `json:"trial_started_at"`
	TrialEndedAt               *time.Time `json:"trial_ended_at"`
	ActivatedAt                *time.Time `json:"activated_at"`
	ExpiresAt                  *time.Time `json:"expires_at"`
	CreatedAt                  *time.Time `json:"created_at"`
	UpdatedAt                  *time.Time `json:"updated_at"`
	CancellationMessage        string     `json:"cancellation_message,omitempty"`
	CancellationMethod         string     `json:"cancellation_method,omitempty"`
	CancelAtEndOfPeriod        bool       `json:"cancel_at_end_of_period"`
	CanceledAt                 *time.Time `json:"canceled_at"`
	CurrentPeriodStartedAt     *time.Time `json:"current_period_started_at"`
	PreviousState              string     `json:"previous_state,omitempty"`
	SignupPaymentID            *int64     `json:"signup_payment_id"`
	SignupRevenue              string     `json:"signup_revenue,omitempty"`
	DelayedCancelAt            *time.Time `json:"delayed_cancel_at"`
	CouponCode                 string     `json:"coupon_code,omitempty"`
	PaymentCollectionMethod    string     `json:"payment_collection_method,omitempty"`
	SnapDay                    string     `json:"snap_day,omitempty"`
	ReasonCode                 string     `json:"reason_code,omitempty"`
	ReceivesInvoiceEmails      bool       `json:"receives_invoice_emails"`
	Locale                     string     `json:"locale,omitempty"`
	Currency                   string     `json:"currency,omitempty"`
	ScheduledCancellationAt    *time.Time `json:"scheduled_cancellation_at"`
	CreditBalanceInCents       int64      `json:"credit_balance_in_cents"`
	PrepaymentBalanceInCents   int64      `json:"prepayment_balance_in_cents"`
	PrepaidConfiguration       interface{} `json:"prepaid_configuration,omitempty"`
	SelfServicePageToken       string     `json:"self_service_page_token,omitempty"`
	Customer                   *Customer  `json:"customer,omitempty"`
	Product                    *Product   `json:"product,omitempty"`
}

// Product represents a Maxio product
type Product struct {
	ID                      int64      `json:"id"`
	Name                    string     `json:"name"`
	Handle                  string     `json:"handle,omitempty"`
	Description             string     `json:"description,omitempty"`
	AccountingCode          string     `json:"accounting_code,omitempty"`
	RequestCreditCard       bool       `json:"request_credit_card"`
	ExpirationInterval      *int       `json:"expiration_interval,omitempty"`
	ExpirationIntervalUnit  string     `json:"expiration_interval_unit,omitempty"`
	CreatedAt               *time.Time `json:"created_at,omitempty"`
	UpdatedAt               *time.Time `json:"updated_at,omitempty"`
	PriceInCents            int64      `json:"price_in_cents"`
	Interval                int        `json:"interval"`
	IntervalUnit            string     `json:"interval_unit"`
	InitialChargeInCents    *int64     `json:"initial_charge_in_cents,omitempty"`
	TrialPriceInCents       *int64     `json:"trial_price_in_cents,omitempty"`
	TrialInterval           *int       `json:"trial_interval,omitempty"`
	TrialIntervalUnit       string     `json:"trial_interval_unit,omitempty"`
	ArchivedAt              *time.Time `json:"archived_at,omitempty"`
	RequireCreditCard       bool       `json:"require_credit_card"`
	ReturnParams            string     `json:"return_params,omitempty"`
	Taxable                 bool       `json:"taxable"`
	UpdateReturnURL         string     `json:"update_return_url,omitempty"`
	TaxCode                 string     `json:"tax_code,omitempty"`
	InitialChargeAfterTrial bool       `json:"initial_charge_after_trial"`
	VersionNumber           int        `json:"version_number"`
	UpdateReturnParams      string     `json:"update_return_params,omitempty"`
	ProductFamily           *ProductFamily `json:"product_family,omitempty"`
}

// ProductFamily represents a Maxio product family
type ProductFamily struct {
	ID             int64      `json:"id"`
	Name           string     `json:"name"`
	Handle         string     `json:"handle,omitempty"`
	AccountingCode string     `json:"accounting_code,omitempty"`
	Description    string     `json:"description,omitempty"`
	CreatedAt      *time.Time `json:"created_at,omitempty"`
	UpdatedAt      *time.Time `json:"updated_at,omitempty"`
}

// ProductWrapper is the wrapper for product responses
type ProductWrapper struct {
	Product Product `json:"product"`
}

// ProductFamilyWrapper is the wrapper for product family responses
type ProductFamilyWrapper struct {
	ProductFamily ProductFamily `json:"product_family"`
}

// CreateProductFamilyRequest is the request body for creating a product family
type CreateProductFamilyRequest struct {
	ProductFamily ProductFamilyInput `json:"product_family"`
}

// ProductFamilyInput is the input for creating a product family
type ProductFamilyInput struct {
	Name        string `json:"name"`
	Handle      string `json:"handle,omitempty"`
	Description string `json:"description,omitempty"`
}

// CreateProductRequest is the request body for creating a product
type CreateProductRequest struct {
	Product ProductInput `json:"product"`
}

// ProductInput is the input for creating a product
type ProductInput struct {
	Name             string `json:"name"`
	Handle           string `json:"handle,omitempty"`
	Description      string `json:"description,omitempty"`
	PriceInCents     int64  `json:"price_in_cents"`
	Interval         int    `json:"interval"`
	IntervalUnit     string `json:"interval_unit"` // month, day, week
	TrialPriceInCents *int64 `json:"trial_price_in_cents,omitempty"`
	TrialInterval    *int   `json:"trial_interval,omitempty"`
	TrialIntervalUnit string `json:"trial_interval_unit,omitempty"`
}

// InvoiceWrapper is the wrapper for invoice responses
type InvoiceWrapper struct {
	Invoice Invoice `json:"invoice"`
}

// Invoice represents a Maxio invoice
type Invoice struct {
	UID                    string     `json:"uid"`
	SiteID                 int64      `json:"site_id"`
	CustomerID             int64      `json:"customer_id"`
	SubscriptionID         int64      `json:"subscription_id"`
	Number                 string     `json:"number"`
	SequenceNumber         int        `json:"sequence_number"`
	TransactionTime        *time.Time `json:"transaction_time,omitempty"`
	CreatedAt              *time.Time `json:"created_at,omitempty"`
	UpdatedAt              *time.Time `json:"updated_at,omitempty"`
	IssueDate              string     `json:"issue_date,omitempty"`
	DueDate                string     `json:"due_date,omitempty"`
	PaidDate               string     `json:"paid_date,omitempty"`
	Status                 string     `json:"status"`
	Role                   string     `json:"role,omitempty"`
	ParentInvoiceID        *int64     `json:"parent_invoice_id,omitempty"`
	CollectionMethod       string     `json:"collection_method,omitempty"`
	PaymentInstructions    string     `json:"payment_instructions,omitempty"`
	Currency               string     `json:"currency,omitempty"`
	ConsolidationLevel     string     `json:"consolidation_level,omitempty"`
	ProductName            string     `json:"product_name,omitempty"`
	ProductFamilyName      string     `json:"product_family_name,omitempty"`
	Seller                 interface{} `json:"seller,omitempty"`
	Customer               interface{} `json:"customer,omitempty"`
	Memo                   string     `json:"memo,omitempty"`
	BillingAddress         interface{} `json:"billing_address,omitempty"`
	ShippingAddress        interface{} `json:"shipping_address,omitempty"`
	SubtotalAmount         string     `json:"subtotal_amount,omitempty"`
	DiscountAmount         string     `json:"discount_amount,omitempty"`
	TaxAmount              string     `json:"tax_amount,omitempty"`
	TotalAmount            string     `json:"total_amount,omitempty"`
	CreditAmount           string     `json:"credit_amount,omitempty"`
	RefundAmount           string     `json:"refund_amount,omitempty"`
	PaidAmount             string     `json:"paid_amount,omitempty"`
	DueAmount              string     `json:"due_amount,omitempty"`
	LineItems              interface{} `json:"line_items,omitempty"`
	Discounts              interface{} `json:"discounts,omitempty"`
	Taxes                  interface{} `json:"taxes,omitempty"`
	Credits                interface{} `json:"credits,omitempty"`
	Refunds                interface{} `json:"refunds,omitempty"`
	Payments               interface{} `json:"payments,omitempty"`
	CustomFields           interface{} `json:"custom_fields,omitempty"`
	PublicURL              string     `json:"public_url,omitempty"`
}

// Payment represents a Maxio payment
type Payment struct {
	TransactionID  int64      `json:"transaction_id"`
	Memo           string     `json:"memo,omitempty"`
	OriginalAmount string     `json:"original_amount,omitempty"`
	AppliedAmount  string     `json:"applied_amount,omitempty"`
	TransactionTime *time.Time `json:"transaction_time,omitempty"`
	PaymentMethod  interface{} `json:"payment_method,omitempty"`
	TransactionType string    `json:"transaction_type,omitempty"`
	Prepayment     bool       `json:"prepayment"`
}

// CreateSubscriptionRequest is the request body for creating a subscription
type CreateSubscriptionRequest struct {
	Subscription SubscriptionInput `json:"subscription"`
}

// SubscriptionInput is the input for creating a subscription
type SubscriptionInput struct {
	CustomerID                int64                `json:"customer_id"`
	ProductID                 int64                `json:"product_id,omitempty"`
	ProductHandle             string               `json:"product_handle,omitempty"`
	ProductPricePointHandle   string               `json:"product_price_point_handle,omitempty"`
	CouponCode                string               `json:"coupon_code,omitempty"`
	PaymentCollectionMethod   string               `json:"payment_collection_method,omitempty"`
	Reference                 string               `json:"reference,omitempty"`
	PaymentProfileAttributes  *PaymentProfileInput `json:"payment_profile_attributes,omitempty"`
	PaymentProfileID          *int64               `json:"payment_profile_id,omitempty"`
	CreditCardAttributes      *CreditCardInput     `json:"credit_card_attributes,omitempty"`
}

// PaymentProfileInput is the input for creating a payment profile inline with subscription
type PaymentProfileInput struct {
	FirstName       string `json:"first_name,omitempty"`
	LastName        string `json:"last_name,omitempty"`
	FullNumber      string `json:"full_number,omitempty"`
	ExpirationMonth int    `json:"expiration_month,omitempty"`
	ExpirationYear  int    `json:"expiration_year,omitempty"`
	CVV             string `json:"cvv,omitempty"`
	BillingAddress  string `json:"billing_address,omitempty"`
	BillingCity     string `json:"billing_city,omitempty"`
	BillingState    string `json:"billing_state,omitempty"`
	BillingZip      string `json:"billing_zip,omitempty"`
	BillingCountry  string `json:"billing_country,omitempty"`
	PaymentType     string `json:"payment_type,omitempty"` // credit_card, bank_account, etc.
}

// CreditCardInput is an alternative input format for credit card info
type CreditCardInput struct {
	FullNumber      string `json:"full_number"`
	ExpirationMonth int    `json:"expiration_month"`
	ExpirationYear  int    `json:"expiration_year"`
	CVV             string `json:"cvv,omitempty"`
}
