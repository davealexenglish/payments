package stripe

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Client is the Stripe API client
type Client struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

// NewClient creates a new Stripe API client
func NewClient(apiKey string) *Client {
	return &Client{
		baseURL:    "https://api.stripe.com/v1",
		apiKey:     apiKey,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// doRequest performs an HTTP request to the Stripe API
func (c *Client) doRequest(method, path string, formData url.Values) (*http.Response, error) {
	var bodyReader io.Reader
	if formData != nil {
		bodyReader = strings.NewReader(formData.Encode())
	}

	req, err := http.NewRequest(method, c.baseURL+path, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Bearer token authentication
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	return c.httpClient.Do(req)
}

// parseError parses an error response from Stripe
func (c *Client) parseError(resp *http.Response) error {
	body, _ := io.ReadAll(resp.Body)

	var errResp ErrorResponse
	if err := json.Unmarshal(body, &errResp); err != nil {
		return NewAPIError(resp.StatusCode, fmt.Sprintf("API error (status %d): %s", resp.StatusCode, string(body)))
	}

	errResp.Error.StatusCode = resp.StatusCode
	return &errResp.Error
}

// TestConnection tests the API connection
func (c *Client) TestConnection() error {
	resp, err := c.doRequest("GET", "/customers?limit=1", nil)
	if err != nil {
		return fmt.Errorf("connection failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 401 {
		return fmt.Errorf("authentication failed: invalid API key")
	}

	if resp.StatusCode != http.StatusOK {
		return c.parseError(resp)
	}

	return nil
}

// ListCustomers returns a list of customers
func (c *Client) ListCustomers(limit int, startingAfter string) (*CustomerList, error) {
	if limit <= 0 {
		limit = 100
	}

	params := url.Values{}
	params.Set("limit", fmt.Sprintf("%d", limit))
	if startingAfter != "" {
		params.Set("starting_after", startingAfter)
	}

	path := "/customers?" + params.Encode()
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, c.parseError(resp)
	}

	var result CustomerList
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}

// GetCustomer returns a single customer by ID
func (c *Client) GetCustomer(id string) (*Customer, error) {
	path := "/customers/" + id
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return nil, NewAPIError(404, "customer not found")
	}

	if resp.StatusCode != http.StatusOK {
		return nil, c.parseError(resp)
	}

	var customer Customer
	if err := json.NewDecoder(resp.Body).Decode(&customer); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &customer, nil
}

// CreateCustomer creates a new customer
func (c *Client) CreateCustomer(input CustomerInput) (*Customer, error) {
	formData := url.Values{}
	if input.Name != "" {
		formData.Set("name", input.Name)
	}
	if input.Email != "" {
		formData.Set("email", input.Email)
	}
	if input.Phone != "" {
		formData.Set("phone", input.Phone)
	}
	if input.Description != "" {
		formData.Set("description", input.Description)
	}
	if input.Address != nil {
		if input.Address.Line1 != "" {
			formData.Set("address[line1]", input.Address.Line1)
		}
		if input.Address.Line2 != "" {
			formData.Set("address[line2]", input.Address.Line2)
		}
		if input.Address.City != "" {
			formData.Set("address[city]", input.Address.City)
		}
		if input.Address.State != "" {
			formData.Set("address[state]", input.Address.State)
		}
		if input.Address.PostalCode != "" {
			formData.Set("address[postal_code]", input.Address.PostalCode)
		}
		if input.Address.Country != "" {
			formData.Set("address[country]", input.Address.Country)
		}
	}
	for k, v := range input.Metadata {
		formData.Set("metadata["+k+"]", v)
	}

	resp, err := c.doRequest("POST", "/customers", formData)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, c.parseError(resp)
	}

	var customer Customer
	if err := json.NewDecoder(resp.Body).Decode(&customer); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &customer, nil
}

// UpdateCustomer updates an existing customer
func (c *Client) UpdateCustomer(id string, input CustomerInput) (*Customer, error) {
	formData := url.Values{}
	if input.Name != "" {
		formData.Set("name", input.Name)
	}
	if input.Email != "" {
		formData.Set("email", input.Email)
	}
	if input.Phone != "" {
		formData.Set("phone", input.Phone)
	}
	if input.Description != "" {
		formData.Set("description", input.Description)
	}

	path := "/customers/" + id
	resp, err := c.doRequest("POST", path, formData)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, c.parseError(resp)
	}

	var customer Customer
	if err := json.NewDecoder(resp.Body).Decode(&customer); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &customer, nil
}

// ListSubscriptions returns a list of subscriptions
func (c *Client) ListSubscriptions(limit int, startingAfter string) (*SubscriptionList, error) {
	if limit <= 0 {
		limit = 100
	}

	params := url.Values{}
	params.Set("limit", fmt.Sprintf("%d", limit))
	if startingAfter != "" {
		params.Set("starting_after", startingAfter)
	}

	path := "/subscriptions?" + params.Encode()
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, c.parseError(resp)
	}

	var result SubscriptionList
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}

// GetSubscription returns a single subscription by ID
func (c *Client) GetSubscription(id string) (*Subscription, error) {
	path := "/subscriptions/" + id
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return nil, NewAPIError(404, "subscription not found")
	}

	if resp.StatusCode != http.StatusOK {
		return nil, c.parseError(resp)
	}

	var subscription Subscription
	if err := json.NewDecoder(resp.Body).Decode(&subscription); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &subscription, nil
}

// ListProducts returns a list of products
func (c *Client) ListProducts(limit int, startingAfter string) (*ProductList, error) {
	if limit <= 0 {
		limit = 100
	}

	params := url.Values{}
	params.Set("limit", fmt.Sprintf("%d", limit))
	params.Set("active", "true")
	if startingAfter != "" {
		params.Set("starting_after", startingAfter)
	}

	path := "/products?" + params.Encode()
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, c.parseError(resp)
	}

	var result ProductList
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}

// GetProduct returns a single product by ID
func (c *Client) GetProduct(id string) (*Product, error) {
	path := "/products/" + id
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return nil, NewAPIError(404, "product not found")
	}

	if resp.StatusCode != http.StatusOK {
		return nil, c.parseError(resp)
	}

	var product Product
	if err := json.NewDecoder(resp.Body).Decode(&product); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &product, nil
}

// ListPrices returns a list of prices (optionally filtered by product)
func (c *Client) ListPrices(productID string, limit int, startingAfter string) (*PriceList, error) {
	if limit <= 0 {
		limit = 100
	}

	params := url.Values{}
	params.Set("limit", fmt.Sprintf("%d", limit))
	params.Set("active", "true")
	if productID != "" {
		params.Set("product", productID)
	}
	if startingAfter != "" {
		params.Set("starting_after", startingAfter)
	}

	path := "/prices?" + params.Encode()
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, c.parseError(resp)
	}

	var result PriceList
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}

// ListInvoices returns a list of invoices
func (c *Client) ListInvoices(limit int, startingAfter string) (*InvoiceList, error) {
	if limit <= 0 {
		limit = 100
	}

	params := url.Values{}
	params.Set("limit", fmt.Sprintf("%d", limit))
	if startingAfter != "" {
		params.Set("starting_after", startingAfter)
	}

	path := "/invoices?" + params.Encode()
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, c.parseError(resp)
	}

	var result InvoiceList
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}

// GetInvoice returns a single invoice by ID
func (c *Client) GetInvoice(id string) (*Invoice, error) {
	path := "/invoices/" + id
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		return nil, NewAPIError(404, "invoice not found")
	}

	if resp.StatusCode != http.StatusOK {
		return nil, c.parseError(resp)
	}

	var invoice Invoice
	if err := json.NewDecoder(resp.Body).Decode(&invoice); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &invoice, nil
}

// ListCharges returns a list of charges (payments)
func (c *Client) ListCharges(limit int, startingAfter string) (*ChargeList, error) {
	if limit <= 0 {
		limit = 100
	}

	params := url.Values{}
	params.Set("limit", fmt.Sprintf("%d", limit))
	if startingAfter != "" {
		params.Set("starting_after", startingAfter)
	}

	path := "/charges?" + params.Encode()
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, c.parseError(resp)
	}

	var result ChargeList
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}

// CreateProduct creates a new product
func (c *Client) CreateProduct(name, description string) (*Product, error) {
	formData := url.Values{}
	formData.Set("name", name)
	if description != "" {
		formData.Set("description", description)
	}

	resp, err := c.doRequest("POST", "/products", formData)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, c.parseError(resp)
	}

	var product Product
	if err := json.NewDecoder(resp.Body).Decode(&product); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &product, nil
}

// CreatePrice creates a new price for a product
func (c *Client) CreatePrice(productID string, unitAmount int64, currency, interval string, intervalCount int) (*Price, error) {
	formData := url.Values{}
	formData.Set("product", productID)
	formData.Set("unit_amount", fmt.Sprintf("%d", unitAmount))
	formData.Set("currency", currency)
	if interval != "" && interval != "one_time" {
		formData.Set("recurring[interval]", interval)
		if intervalCount > 0 {
			formData.Set("recurring[interval_count]", fmt.Sprintf("%d", intervalCount))
		}
	}

	resp, err := c.doRequest("POST", "/prices", formData)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, c.parseError(resp)
	}

	var price Price
	if err := json.NewDecoder(resp.Body).Decode(&price); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &price, nil
}

// ListPaymentIntents returns a list of payment intents
func (c *Client) ListPaymentIntents(limit int, startingAfter string) (*PaymentIntentList, error) {
	if limit <= 0 {
		limit = 100
	}

	params := url.Values{}
	params.Set("limit", fmt.Sprintf("%d", limit))
	if startingAfter != "" {
		params.Set("starting_after", startingAfter)
	}

	path := "/payment_intents?" + params.Encode()
	resp, err := c.doRequest("GET", path, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, c.parseError(resp)
	}

	var result PaymentIntentList
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &result, nil
}

// CreateSubscription creates a new subscription for a customer with a price
func (c *Client) CreateSubscription(customerID, priceID string, paymentBehavior string) (*Subscription, error) {
	formData := url.Values{}
	formData.Set("customer", customerID)
	formData.Set("items[0][price]", priceID)
	if paymentBehavior != "" {
		formData.Set("payment_behavior", paymentBehavior)
	} else {
		// Default to error_if_incomplete for simpler error handling
		formData.Set("payment_behavior", "error_if_incomplete")
	}

	resp, err := c.doRequest("POST", "/subscriptions", formData)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, c.parseError(resp)
	}

	var subscription Subscription
	if err := json.NewDecoder(resp.Body).Decode(&subscription); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &subscription, nil
}
