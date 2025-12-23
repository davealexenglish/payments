package zuora

import "time"

// APIError represents an error from the Zuora API with status code
type APIError struct {
	StatusCode int
	Message    string
}

func (e *APIError) Error() string {
	return e.Message
}

// NewAPIError creates a new API error
func NewAPIError(statusCode int, message string) *APIError {
	return &APIError{StatusCode: statusCode, Message: message}
}

// TokenResponse represents the OAuth token response
type TokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
	Scope       string `json:"scope"`
	JTI         string `json:"jti"`
}

// Account represents a Zuora account (maps to Customer in frontend)
type Account struct {
	ID            string     `json:"id"`
	AccountNumber string     `json:"accountNumber,omitempty"`
	Name          string     `json:"name"`
	Status        string     `json:"status,omitempty"`
	Currency      string     `json:"currency,omitempty"`
	PaymentTerm   string     `json:"paymentTerm,omitempty"`
	BillCycleDay  int        `json:"billCycleDay,omitempty"`
	AutoPay       bool       `json:"autoPay,omitempty"`
	Notes         string     `json:"notes,omitempty"`
	CreatedDate   *time.Time `json:"createdDate,omitempty"`
	UpdatedDate   *time.Time `json:"updatedDate,omitempty"`
	BillToContact *Contact   `json:"billToContact,omitempty"`
	SoldToContact *Contact   `json:"soldToContact,omitempty"`
}

// Contact represents a Zuora contact
type Contact struct {
	ID         string `json:"id,omitempty"`
	FirstName  string `json:"firstName,omitempty"`
	LastName   string `json:"lastName,omitempty"`
	WorkEmail  string `json:"workEmail,omitempty"`
	Address1   string `json:"address1,omitempty"`
	Address2   string `json:"address2,omitempty"`
	City       string `json:"city,omitempty"`
	State      string `json:"state,omitempty"`
	PostalCode string `json:"postalCode,omitempty"`
	Country    string `json:"country,omitempty"`
	WorkPhone  string `json:"workPhone,omitempty"`
}

// AccountsResponse represents a list of accounts response
type AccountsResponse struct {
	Accounts []Account `json:"accounts"`
	NextPage string    `json:"nextPage,omitempty"`
	Success  bool      `json:"success"`
}

// CreateAccountRequest is the request body for creating an account
type CreateAccountRequest struct {
	Name          string   `json:"name"`
	Currency      string   `json:"currency"`
	BillCycleDay  int      `json:"billCycleDay,omitempty"`
	AutoPay       bool     `json:"autoPay,omitempty"`
	PaymentTerm   string   `json:"paymentTerm,omitempty"`
	BillToContact *Contact `json:"billToContact,omitempty"`
	SoldToContact *Contact `json:"soldToContact,omitempty"`
	Notes         string   `json:"notes,omitempty"`
}

// Subscription represents a Zuora subscription
type Subscription struct {
	ID                     string     `json:"id"`
	SubscriptionNumber     string     `json:"subscriptionNumber,omitempty"`
	AccountID              string     `json:"accountId,omitempty"`
	AccountNumber          string     `json:"accountNumber,omitempty"`
	AccountName            string     `json:"accountName,omitempty"`
	Status                 string     `json:"status,omitempty"`
	ContractEffectiveDate  string     `json:"contractEffectiveDate,omitempty"`
	ServiceActivationDate  string     `json:"serviceActivationDate,omitempty"`
	CustomerAcceptanceDate string     `json:"customerAcceptanceDate,omitempty"`
	TermStartDate          string     `json:"termStartDate,omitempty"`
	TermEndDate            string     `json:"termEndDate,omitempty"`
	CurrentTerm            int        `json:"currentTerm,omitempty"`
	CurrentTermPeriodType  string     `json:"currentTermPeriodType,omitempty"`
	RenewalTerm            int        `json:"renewalTerm,omitempty"`
	RenewalTermPeriodType  string     `json:"renewalTermPeriodType,omitempty"`
	AutoRenew              bool       `json:"autoRenew,omitempty"`
	Notes                  string     `json:"notes,omitempty"`
	CreatedDate            *time.Time `json:"createdDate,omitempty"`
	UpdatedDate            *time.Time `json:"updatedDate,omitempty"`
	RatePlans              []RatePlan `json:"ratePlans,omitempty"`
}

// RatePlan represents a Zuora rate plan within a subscription
type RatePlan struct {
	ID                string `json:"id"`
	ProductID         string `json:"productId,omitempty"`
	ProductName       string `json:"productName,omitempty"`
	ProductRatePlanID string `json:"productRatePlanId,omitempty"`
	RatePlanName      string `json:"ratePlanName,omitempty"`
}

// SubscriptionsResponse represents a list of subscriptions response
type SubscriptionsResponse struct {
	Subscriptions []Subscription `json:"subscriptions"`
	NextPage      string         `json:"nextPage,omitempty"`
	Success       bool           `json:"success"`
}

// Product represents a Zuora product (maps to ProductFamily in frontend)
type Product struct {
	ID                 string            `json:"id"`
	Name               string            `json:"name"`
	SKU                string            `json:"sku,omitempty"`
	Description        string            `json:"description,omitempty"`
	Category           string            `json:"category,omitempty"`
	EffectiveStartDate string            `json:"effectiveStartDate,omitempty"`
	EffectiveEndDate   string            `json:"effectiveEndDate,omitempty"`
	CreatedDate        *time.Time        `json:"createdDate,omitempty"`
	UpdatedDate        *time.Time        `json:"updatedDate,omitempty"`
	ProductRatePlans   []ProductRatePlan `json:"productRatePlans,omitempty"`
}

// ProductRatePlan represents a Zuora product rate plan (maps to Product in frontend)
type ProductRatePlan struct {
	ID                     string                  `json:"id"`
	Name                   string                  `json:"name"`
	Description            string                  `json:"description,omitempty"`
	EffectiveStartDate     string                  `json:"effectiveStartDate,omitempty"`
	EffectiveEndDate       string                  `json:"effectiveEndDate,omitempty"`
	Status                 string                  `json:"status,omitempty"`
	CreatedDate            *time.Time              `json:"createdDate,omitempty"`
	UpdatedDate            *time.Time              `json:"updatedDate,omitempty"`
	ProductRatePlanCharges []ProductRatePlanCharge `json:"productRatePlanCharges,omitempty"`
}

// ProductRatePlanCharge represents a charge on a product rate plan
type ProductRatePlanCharge struct {
	ID              string  `json:"id"`
	Name            string  `json:"name"`
	Type            string  `json:"type,omitempty"` // OneTime, Recurring, Usage
	Model           string  `json:"model,omitempty"`
	UOM             string  `json:"uom,omitempty"`
	BillingPeriod   string  `json:"billingPeriod,omitempty"`
	DefaultQuantity float64 `json:"defaultQuantity,omitempty"`
}

// ProductsResponse represents a list of products response from catalog
type ProductsResponse struct {
	Products []Product `json:"products"`
	NextPage string    `json:"nextPage,omitempty"`
	Success  bool      `json:"success"`
}

// Invoice represents a Zuora invoice
type Invoice struct {
	ID            string     `json:"id"`
	InvoiceNumber string     `json:"invoiceNumber,omitempty"`
	AccountID     string     `json:"accountId,omitempty"`
	AccountNumber string     `json:"accountNumber,omitempty"`
	AccountName   string     `json:"accountName,omitempty"`
	InvoiceDate   string     `json:"invoiceDate,omitempty"`
	DueDate       string     `json:"dueDate,omitempty"`
	Status        string     `json:"status,omitempty"`
	Amount        float64    `json:"amount,omitempty"`
	Balance       float64    `json:"balance,omitempty"`
	Currency      string     `json:"currency,omitempty"`
	CreatedDate   *time.Time `json:"createdDate,omitempty"`
	UpdatedDate   *time.Time `json:"updatedDate,omitempty"`
}

// InvoicesResponse represents a list of invoices response
type InvoicesResponse struct {
	Invoices []Invoice `json:"invoices"`
	NextPage string    `json:"nextPage,omitempty"`
	Success  bool      `json:"success"`
}
