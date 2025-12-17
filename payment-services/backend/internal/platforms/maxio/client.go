package maxio

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client is the Maxio API client
type Client struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

// NewClient creates a new Maxio API client
func NewClient(subdomain, apiKey string) *Client {
	return &Client{
		baseURL:    fmt.Sprintf("https://%s.chargify.com", subdomain),
		apiKey:     apiKey,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// doRequest performs an HTTP request to the Maxio API
func (c *Client) doRequest(method, path string, body interface{}) (*http.Response, error) {
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

	// Basic Auth: api_key:x (password is literally "x")
	auth := base64.StdEncoding.EncodeToString([]byte(c.apiKey + ":x"))
	req.Header.Set("Authorization", "Basic "+auth)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	return c.httpClient.Do(req)
}

// TestConnection tests the API connection
func (c *Client) TestConnection() error {
	resp, err := c.doRequest("GET", "/customers.json?per_page=1", nil)
	if err != nil {
		return fmt.Errorf("connection failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 401 {
		return fmt.Errorf("authentication failed: invalid API key")
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	return nil
}

// ListCustomers returns a list of customers
func (c *Client) ListCustomers(page, perPage int) ([]Customer, error) {
	if perPage <= 0 {
		perPage = 50
	}
	if page <= 0 {
		page = 1
	}

	path := fmt.Sprintf("/customers.json?page=%d&per_page=%d", page, perPage)
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	var wrappers []CustomerWrapper
	if err := json.NewDecoder(resp.Body).Decode(&wrappers); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	customers := make([]Customer, len(wrappers))
	for i, w := range wrappers {
		customers[i] = w.Customer
	}

	return customers, nil
}

// GetCustomer returns a single customer by ID
func (c *Client) GetCustomer(id string) (*Customer, error) {
	path := fmt.Sprintf("/customers/%s.json", id)
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return nil, fmt.Errorf("customer not found")
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	var wrapper CustomerWrapper
	if err := json.NewDecoder(resp.Body).Decode(&wrapper); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &wrapper.Customer, nil
}

// CreateCustomer creates a new customer
func (c *Client) CreateCustomer(input CustomerInput) (*Customer, error) {
	req := CreateCustomerRequest{Customer: input}

	resp, err := c.doRequest("POST", "/customers.json", req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	var wrapper CustomerWrapper
	if err := json.NewDecoder(resp.Body).Decode(&wrapper); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &wrapper.Customer, nil
}

// ListSubscriptions returns a list of subscriptions
func (c *Client) ListSubscriptions(page, perPage int) ([]Subscription, error) {
	if perPage <= 0 {
		perPage = 50
	}
	if page <= 0 {
		page = 1
	}

	path := fmt.Sprintf("/subscriptions.json?page=%d&per_page=%d", page, perPage)
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	var wrappers []SubscriptionWrapper
	if err := json.NewDecoder(resp.Body).Decode(&wrappers); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	subscriptions := make([]Subscription, len(wrappers))
	for i, w := range wrappers {
		subscriptions[i] = w.Subscription
	}

	return subscriptions, nil
}

// GetSubscription returns a single subscription by ID
func (c *Client) GetSubscription(id string) (*Subscription, error) {
	path := fmt.Sprintf("/subscriptions/%s.json", id)
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return nil, fmt.Errorf("subscription not found")
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	var wrapper SubscriptionWrapper
	if err := json.NewDecoder(resp.Body).Decode(&wrapper); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &wrapper.Subscription, nil
}

// ListProducts returns a list of products
func (c *Client) ListProducts(page, perPage int) ([]Product, error) {
	if perPage <= 0 {
		perPage = 50
	}
	if page <= 0 {
		page = 1
	}

	path := fmt.Sprintf("/products.json?page=%d&per_page=%d", page, perPage)
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	var wrappers []ProductWrapper
	if err := json.NewDecoder(resp.Body).Decode(&wrappers); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	products := make([]Product, len(wrappers))
	for i, w := range wrappers {
		products[i] = w.Product
	}

	return products, nil
}

// ListInvoices returns a list of invoices
func (c *Client) ListInvoices(page, perPage int) ([]Invoice, error) {
	if perPage <= 0 {
		perPage = 50
	}
	if page <= 0 {
		page = 1
	}

	path := fmt.Sprintf("/invoices.json?page=%d&per_page=%d", page, perPage)
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	var result struct {
		Invoices []Invoice `json:"invoices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return result.Invoices, nil
}
