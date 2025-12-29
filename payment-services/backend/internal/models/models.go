package models

import "time"

// PlatformType represents supported payment platforms
type PlatformType string

const (
	PlatformMaxio  PlatformType = "maxio"
	PlatformZuora  PlatformType = "zuora"
	PlatformStripe PlatformType = "stripe"
)

// ConnectionStatus represents the state of a platform connection
type ConnectionStatus string

const (
	StatusPending   ConnectionStatus = "pending"
	StatusConnected ConnectionStatus = "connected"
	StatusError     ConnectionStatus = "error"
)

// PlatformConnection represents a connection to a payment platform
type PlatformConnection struct {
	ID           int64            `json:"id"`
	PlatformType PlatformType     `json:"platform_type"`
	Name         string           `json:"name"`
	Subdomain    string           `json:"subdomain,omitempty"`
	BaseURL      string           `json:"base_url,omitempty"` // Used by Zuora for different data centers
	IsSandbox    bool             `json:"is_sandbox"`
	Status       ConnectionStatus `json:"status"`
	ErrorMessage string           `json:"error_message,omitempty"`
	LastSyncAt   *time.Time       `json:"last_sync_at,omitempty"`
	CreatedAt    time.Time        `json:"created_at"`
	UpdatedAt    time.Time        `json:"updated_at"`
}

// PlatformCredential represents an API credential for a connection
type PlatformCredential struct {
	ID              int64     `json:"id"`
	ConnectionID    int64     `json:"connection_id"`
	CredentialType  string    `json:"credential_type"`
	CredentialValue string    `json:"-"` // Never serialize
	CreatedAt       time.Time `json:"created_at"`
}

// Customer represents a customer from any platform
type Customer struct {
	ID           string                 `json:"id"`
	Reference    string                 `json:"reference,omitempty"`
	FirstName    string                 `json:"first_name,omitempty"`
	LastName     string                 `json:"last_name,omitempty"`
	Email        string                 `json:"email,omitempty"`
	Organization string                 `json:"organization,omitempty"`
	CreatedAt    *time.Time             `json:"created_at,omitempty"`
	RawData      map[string]interface{} `json:"raw_data,omitempty"`
}

// Subscription represents a subscription from any platform
type Subscription struct {
	ID                 string                 `json:"id"`
	CustomerID         string                 `json:"customer_id,omitempty"`
	ProductName        string                 `json:"product_name,omitempty"`
	State              string                 `json:"state,omitempty"`
	CurrentPeriodStart *time.Time             `json:"current_period_start,omitempty"`
	CurrentPeriodEnd   *time.Time             `json:"current_period_end,omitempty"`
	CreatedAt          *time.Time             `json:"created_at,omitempty"`
	RawData            map[string]interface{} `json:"raw_data,omitempty"`
}

// Invoice represents an invoice from any platform
type Invoice struct {
	ID         string                 `json:"id"`
	Number     string                 `json:"number,omitempty"`
	CustomerID string                 `json:"customer_id,omitempty"`
	Status     string                 `json:"status,omitempty"`
	Total      string                 `json:"total,omitempty"`
	Currency   string                 `json:"currency,omitempty"`
	DueDate    *time.Time             `json:"due_date,omitempty"`
	CreatedAt  *time.Time             `json:"created_at,omitempty"`
	RawData    map[string]interface{} `json:"raw_data,omitempty"`
}

// Payment represents a payment from any platform
type Payment struct {
	ID        string                 `json:"id"`
	Amount    string                 `json:"amount,omitempty"`
	Currency  string                 `json:"currency,omitempty"`
	Status    string                 `json:"status,omitempty"`
	CreatedAt *time.Time             `json:"created_at,omitempty"`
	RawData   map[string]interface{} `json:"raw_data,omitempty"`
}

// Product represents a product from any platform
type Product struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name,omitempty"`
	Handle      string                 `json:"handle,omitempty"`
	Description string                 `json:"description,omitempty"`
	Price       string                 `json:"price,omitempty"`
	Interval    string                 `json:"interval,omitempty"`
	CreatedAt   *time.Time             `json:"created_at,omitempty"`
	RawData     map[string]interface{} `json:"raw_data,omitempty"`
}

// TreeNode represents a node in the UI tree
type TreeNode struct {
	ID           string      `json:"id"`
	Type         string      `json:"type"`
	Name         string      `json:"name"`
	ConnectionID *int64      `json:"connection_id,omitempty"`
	PlatformType string      `json:"platform_type,omitempty"`
	Children     []*TreeNode `json:"children,omitempty"`
	IsExpandable bool        `json:"is_expandable"`
	Data         interface{} `json:"data,omitempty"`
}

// CreateConnectionRequest is the request body for creating a connection
type CreateConnectionRequest struct {
	PlatformType PlatformType `json:"platform_type"`
	Name         string       `json:"name"`
	Subdomain    string       `json:"subdomain,omitempty"`     // Used by Maxio
	BaseURL      string       `json:"base_url,omitempty"`      // Used by Zuora for different data centers
	APIKey       string       `json:"api_key,omitempty"`       // Used by Maxio, Stripe
	ClientID     string       `json:"client_id,omitempty"`     // Used by Zuora
	ClientSecret string       `json:"client_secret,omitempty"` // Used by Zuora
	IsSandbox    bool         `json:"is_sandbox"`
}

// CreateCustomerRequest is the request body for creating a customer
type CreateCustomerRequest struct {
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	Email        string `json:"email"`
	Organization string `json:"organization,omitempty"`
	Reference    string `json:"reference,omitempty"`
}
