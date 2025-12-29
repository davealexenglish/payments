package zuora

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

// Client is the Zuora API client
type Client struct {
	baseURL      string
	clientID     string
	clientSecret string
	httpClient   *http.Client

	// Token management
	accessToken string
	tokenExpiry time.Time
	tokenMutex  sync.RWMutex
}

// NewClient creates a new Zuora API client
// baseURL should be like "https://rest.zuora.com" for production or "https://rest.apisandbox.zuora.com" for sandbox
func NewClient(baseURL, clientID, clientSecret string) *Client {
	return &Client{
		baseURL:      strings.TrimSuffix(baseURL, "/"),
		clientID:     clientID,
		clientSecret: clientSecret,
		httpClient:   &http.Client{Timeout: 30 * time.Second},
	}
}

// getAccessToken returns a valid access token, refreshing if necessary
func (c *Client) getAccessToken() (string, error) {
	c.tokenMutex.RLock()
	if c.accessToken != "" && time.Now().Before(c.tokenExpiry) {
		token := c.accessToken
		c.tokenMutex.RUnlock()
		return token, nil
	}
	c.tokenMutex.RUnlock()

	// Need to refresh token
	c.tokenMutex.Lock()
	defer c.tokenMutex.Unlock()

	// Double-check after acquiring write lock
	if c.accessToken != "" && time.Now().Before(c.tokenExpiry) {
		return c.accessToken, nil
	}

	// Request new token
	data := url.Values{}
	data.Set("client_id", c.clientID)
	data.Set("client_secret", c.clientSecret)
	data.Set("grant_type", "client_credentials")

	req, err := http.NewRequest("POST", c.baseURL+"/oauth/token", strings.NewReader(data.Encode()))
	if err != nil {
		return "", fmt.Errorf("failed to create token request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("token request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("token request failed (status %d): %s", resp.StatusCode, string(body))
	}

	var tokenResp TokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", fmt.Errorf("failed to decode token response: %w", err)
	}

	c.accessToken = tokenResp.AccessToken
	// Set expiry with a 60-second buffer
	c.tokenExpiry = time.Now().Add(time.Duration(tokenResp.ExpiresIn-60) * time.Second)

	return c.accessToken, nil
}

// doRequest performs an HTTP request to the Zuora API
func (c *Client) doRequest(method, path string, body interface{}) (*http.Response, error) {
	token, err := c.getAccessToken()
	if err != nil {
		return nil, err
	}

	var bodyReader io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		bodyReader = bytes.NewReader(jsonBody)
	}

	req, err := http.NewRequest(method, c.baseURL+path, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	return c.httpClient.Do(req)
}

// TestConnection tests the API connection
func (c *Client) TestConnection() error {
	// Try to get a token - this validates credentials
	_, err := c.getAccessToken()
	if err != nil {
		return fmt.Errorf("authentication failed: %w", err)
	}

	// Try a simple API call to verify API access
	resp, err := c.doRequest("GET", "/v1/catalog/products?pageSize=1", nil)
	if err != nil {
		return fmt.Errorf("connection failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 401 {
		return fmt.Errorf("authentication failed: invalid credentials")
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	return nil
}

// ListAccounts returns a list of accounts using ZOQL query
func (c *Client) ListAccounts(page, pageSize int) ([]Account, error) {
	if pageSize <= 0 {
		pageSize = 50
	}
	if page <= 0 {
		page = 1
	}

	// Use ZOQL to query accounts (ZOQL doesn't support ORDER BY or LIMIT)
	query := "SELECT Id, Name, AccountNumber, Status, Currency, Balance, CreatedDate FROM Account"

	queryReq := map[string]string{
		"queryString": query,
	}

	resp, err := c.doRequest("POST", "/v1/action/query", queryReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, NewAPIError(resp.StatusCode, fmt.Sprintf("API error (status %d): %s", resp.StatusCode, string(body)))
	}

	var result ZOQLQueryResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if !result.Done {
		// For simplicity, we're not handling pagination here
		// In production, you'd follow the queryLocator for more results
	}

	// Convert ZOQL records to Account structs
	accounts := make([]Account, 0, len(result.Records))
	for _, record := range result.Records {
		account := Account{
			ID:            getString(record, "Id"),
			Name:          getString(record, "Name"),
			AccountNumber: getString(record, "AccountNumber"),
			Status:        getString(record, "Status"),
			Currency:      getString(record, "Currency"),
		}
		if balance, ok := record["Balance"].(float64); ok {
			account.Balance = balance
		}
		if createdDate, ok := record["CreatedDate"].(string); ok {
			if t, err := time.Parse(time.RFC3339, createdDate); err == nil {
				account.CreatedDate = &t
			}
		}
		accounts = append(accounts, account)
	}

	return accounts, nil
}

// Helper to safely get string from map
func getString(m map[string]interface{}, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}

// GetAccount returns a single account by key (id or accountNumber)
func (c *Client) GetAccount(accountKey string) (*Account, error) {
	path := fmt.Sprintf("/v1/accounts/%s", accountKey)
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return nil, NewAPIError(404, "account not found")
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, NewAPIError(resp.StatusCode, fmt.Sprintf("API error (status %d): %s", resp.StatusCode, string(body)))
	}

	var account Account
	if err := json.NewDecoder(resp.Body).Decode(&account); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &account, nil
}

// CreateAccount creates a new account
func (c *Client) CreateAccount(input CreateAccountRequest) (*Account, error) {
	resp, err := c.doRequest("POST", "/v1/accounts", input)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return nil, NewAPIError(resp.StatusCode, fmt.Sprintf("API error (status %d): %s", resp.StatusCode, string(body)))
	}

	var result struct {
		Success   bool   `json:"success"`
		AccountID string `json:"accountId"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Fetch the created account
	return c.GetAccount(result.AccountID)
}

// ListSubscriptions returns a list of subscriptions using ZOQL query
func (c *Client) ListSubscriptions(page, pageSize int) ([]Subscription, error) {
	if pageSize <= 0 {
		pageSize = 50
	}
	if page <= 0 {
		page = 1
	}

	// Use ZOQL to query subscriptions (ZOQL doesn't support ORDER BY or LIMIT)
	query := "SELECT Id, Name, AccountId, Status, ContractEffectiveDate, TermStartDate, TermEndDate, CreatedDate FROM Subscription"

	queryReq := map[string]string{
		"queryString": query,
	}

	resp, err := c.doRequest("POST", "/v1/action/query", queryReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, NewAPIError(resp.StatusCode, fmt.Sprintf("API error (status %d): %s", resp.StatusCode, string(body)))
	}

	var result ZOQLQueryResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Convert ZOQL records to Subscription structs
	subscriptions := make([]Subscription, 0, len(result.Records))
	for _, record := range result.Records {
		sub := Subscription{
			ID:                    getString(record, "Id"),
			SubscriptionNumber:    getString(record, "Name"),
			AccountID:             getString(record, "AccountId"),
			Status:                getString(record, "Status"),
			ContractEffectiveDate: getString(record, "ContractEffectiveDate"),
			TermStartDate:         getString(record, "TermStartDate"),
			TermEndDate:           getString(record, "TermEndDate"),
		}
		if createdDate, ok := record["CreatedDate"].(string); ok {
			if t, err := time.Parse(time.RFC3339, createdDate); err == nil {
				sub.CreatedDate = &t
			}
		}
		subscriptions = append(subscriptions, sub)
	}

	return subscriptions, nil
}

// GetSubscription returns a single subscription by key
func (c *Client) GetSubscription(subscriptionKey string) (*Subscription, error) {
	path := fmt.Sprintf("/v1/subscriptions/%s", subscriptionKey)
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return nil, NewAPIError(404, "subscription not found")
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, NewAPIError(resp.StatusCode, fmt.Sprintf("API error (status %d): %s", resp.StatusCode, string(body)))
	}

	var subscription Subscription
	if err := json.NewDecoder(resp.Body).Decode(&subscription); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &subscription, nil
}

// ListProducts returns a list of products using ZOQL query
func (c *Client) ListProducts(page, pageSize int) ([]Product, error) {
	if pageSize <= 0 {
		pageSize = 50
	}
	if page <= 0 {
		page = 1
	}

	// Use ZOQL to query products
	query := "SELECT Id, Name, SKU, Description, Category, EffectiveStartDate, EffectiveEndDate, CreatedDate FROM Product"

	queryReq := map[string]string{
		"queryString": query,
	}

	resp, err := c.doRequest("POST", "/v1/action/query", queryReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, NewAPIError(resp.StatusCode, fmt.Sprintf("API error (status %d): %s", resp.StatusCode, string(body)))
	}

	var result ZOQLQueryResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Convert ZOQL records to Product structs
	products := make([]Product, 0, len(result.Records))
	for _, record := range result.Records {
		product := Product{
			ID:                 getString(record, "Id"),
			Name:               getString(record, "Name"),
			SKU:                getString(record, "SKU"),
			Description:        getString(record, "Description"),
			Category:           getString(record, "Category"),
			EffectiveStartDate: getString(record, "EffectiveStartDate"),
			EffectiveEndDate:   getString(record, "EffectiveEndDate"),
		}
		if createdDate, ok := record["CreatedDate"].(string); ok {
			if t, err := time.Parse(time.RFC3339, createdDate); err == nil {
				product.CreatedDate = &t
			}
		}
		products = append(products, product)
	}

	return products, nil
}

// GetProduct returns a single product by key
func (c *Client) GetProduct(productKey string) (*Product, error) {
	path := fmt.Sprintf("/v1/catalog/products/%s", productKey)
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return nil, NewAPIError(404, "product not found")
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, NewAPIError(resp.StatusCode, fmt.Sprintf("API error (status %d): %s", resp.StatusCode, string(body)))
	}

	var product Product
	if err := json.NewDecoder(resp.Body).Decode(&product); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &product, nil
}

// ListProductRatePlans returns rate plans for a specific product
func (c *Client) ListProductRatePlans(productKey string) ([]ProductRatePlan, error) {
	path := fmt.Sprintf("/v1/products/%s/product-rate-plans", productKey)
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, NewAPIError(resp.StatusCode, fmt.Sprintf("API error (status %d): %s", resp.StatusCode, string(body)))
	}

	var result struct {
		ProductRatePlans []ProductRatePlan `json:"productRatePlans"`
		NextPage         string            `json:"nextPage,omitempty"`
		Success          bool              `json:"success"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return result.ProductRatePlans, nil
}

// ListInvoices returns a list of invoices using ZOQL query
func (c *Client) ListInvoices(page, pageSize int) ([]Invoice, error) {
	if pageSize <= 0 {
		pageSize = 50
	}
	if page <= 0 {
		page = 1
	}

	// Use ZOQL to query invoices
	query := "SELECT Id, InvoiceNumber, AccountId, InvoiceDate, DueDate, Status, Amount, Balance, CreatedDate FROM Invoice"

	queryReq := map[string]string{
		"queryString": query,
	}

	resp, err := c.doRequest("POST", "/v1/action/query", queryReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, NewAPIError(resp.StatusCode, fmt.Sprintf("API error (status %d): %s", resp.StatusCode, string(body)))
	}

	var result ZOQLQueryResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Convert ZOQL records to Invoice structs
	invoices := make([]Invoice, 0, len(result.Records))
	for _, record := range result.Records {
		invoice := Invoice{
			ID:            getString(record, "Id"),
			InvoiceNumber: getString(record, "InvoiceNumber"),
			AccountID:     getString(record, "AccountId"),
			InvoiceDate:   getString(record, "InvoiceDate"),
			DueDate:       getString(record, "DueDate"),
			Status:        getString(record, "Status"),
		}
		if amount, ok := record["Amount"].(float64); ok {
			invoice.Amount = amount
		}
		if balance, ok := record["Balance"].(float64); ok {
			invoice.Balance = balance
		}
		if createdDate, ok := record["CreatedDate"].(string); ok {
			if t, err := time.Parse(time.RFC3339, createdDate); err == nil {
				invoice.CreatedDate = &t
			}
		}
		invoices = append(invoices, invoice)
	}

	return invoices, nil
}

// GetInvoice returns a single invoice by ID
func (c *Client) GetInvoice(invoiceID string) (*Invoice, error) {
	path := fmt.Sprintf("/v1/invoices/%s", invoiceID)
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return nil, NewAPIError(404, "invoice not found")
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, NewAPIError(resp.StatusCode, fmt.Sprintf("API error (status %d): %s", resp.StatusCode, string(body)))
	}

	var invoice Invoice
	if err := json.NewDecoder(resp.Body).Decode(&invoice); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &invoice, nil
}

// ListPayments returns a list of payments using ZOQL query
func (c *Client) ListPayments(page, pageSize int) ([]Payment, error) {
	if pageSize <= 0 {
		pageSize = 50
	}
	if page <= 0 {
		page = 1
	}

	// Use ZOQL to query payments
	query := "SELECT Id, PaymentNumber, AccountId, Amount, EffectiveDate, Status, Type, CreatedDate FROM Payment"

	queryReq := map[string]string{
		"queryString": query,
	}

	resp, err := c.doRequest("POST", "/v1/action/query", queryReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, NewAPIError(resp.StatusCode, fmt.Sprintf("API error (status %d): %s", resp.StatusCode, string(body)))
	}

	var result ZOQLQueryResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Convert ZOQL records to Payment structs
	payments := make([]Payment, 0, len(result.Records))
	for _, record := range result.Records {
		payment := Payment{
			ID:            getString(record, "Id"),
			PaymentNumber: getString(record, "PaymentNumber"),
			AccountID:     getString(record, "AccountId"),
			EffectiveDate: getString(record, "EffectiveDate"),
			Status:        getString(record, "Status"),
			Type:          getString(record, "Type"),
		}
		if amount, ok := record["Amount"].(float64); ok {
			payment.Amount = amount
		}
		if createdDate, ok := record["CreatedDate"].(string); ok {
			if t, err := time.Parse(time.RFC3339, createdDate); err == nil {
				payment.CreatedDate = &t
			}
		}
		payments = append(payments, payment)
	}

	return payments, nil
}
