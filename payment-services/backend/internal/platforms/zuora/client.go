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

// ListAccounts returns a list of accounts
func (c *Client) ListAccounts(page, pageSize int) ([]Account, error) {
	if pageSize <= 0 {
		pageSize = 50
	}
	if page <= 0 {
		page = 1
	}

	path := fmt.Sprintf("/v1/accounts?pageSize=%d&page=%d", pageSize, page)
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, NewAPIError(resp.StatusCode, fmt.Sprintf("API error (status %d): %s", resp.StatusCode, string(body)))
	}

	var result AccountsResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return result.Accounts, nil
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

// ListSubscriptions returns a list of subscriptions
func (c *Client) ListSubscriptions(page, pageSize int) ([]Subscription, error) {
	if pageSize <= 0 {
		pageSize = 50
	}
	if page <= 0 {
		page = 1
	}

	path := fmt.Sprintf("/v1/subscriptions?pageSize=%d&page=%d", pageSize, page)
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, NewAPIError(resp.StatusCode, fmt.Sprintf("API error (status %d): %s", resp.StatusCode, string(body)))
	}

	var result SubscriptionsResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return result.Subscriptions, nil
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

// ListProducts returns a list of products from the catalog
func (c *Client) ListProducts(page, pageSize int) ([]Product, error) {
	if pageSize <= 0 {
		pageSize = 50
	}
	if page <= 0 {
		page = 1
	}

	path := fmt.Sprintf("/v1/catalog/products?pageSize=%d&page=%d", pageSize, page)
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, NewAPIError(resp.StatusCode, fmt.Sprintf("API error (status %d): %s", resp.StatusCode, string(body)))
	}

	var result ProductsResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return result.Products, nil
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

// ListInvoices returns a list of invoices
func (c *Client) ListInvoices(page, pageSize int) ([]Invoice, error) {
	if pageSize <= 0 {
		pageSize = 50
	}
	if page <= 0 {
		page = 1
	}

	path := fmt.Sprintf("/v1/invoices?pageSize=%d&page=%d", pageSize, page)
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, NewAPIError(resp.StatusCode, fmt.Sprintf("API error (status %d): %s", resp.StatusCode, string(body)))
	}

	var result InvoicesResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return result.Invoices, nil
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
