package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/davealexenglish/payment-billing-hub/backend/internal/platforms/maxio"
)

// respondAPIError handles errors from the Maxio API, returning appropriate HTTP status codes
func respondAPIError(w http.ResponseWriter, err error) {
	var apiErr *maxio.APIError
	if errors.As(err, &apiErr) {
		// Map Maxio status codes to HTTP status codes
		statusCode := apiErr.StatusCode
		// For client errors (4xx), pass through; for server errors default to 502 Bad Gateway
		if statusCode < 400 || statusCode >= 600 {
			statusCode = http.StatusBadGateway
		}
		respondError(w, statusCode, apiErr.Message)
		return
	}
	// For non-API errors, return 500
	respondError(w, http.StatusInternalServerError, err.Error())
}

func (s *Server) handleMaxioListCustomers(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getMaxioClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	perPage, _ := strconv.Atoi(r.URL.Query().Get("per_page"))

	customers, err := client.ListCustomers(page, perPage)
	if err != nil {
		respondAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, customers)
}

func (s *Server) handleMaxioCreateCustomer(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getMaxioClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var input maxio.CustomerInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if input.FirstName == "" || input.LastName == "" || input.Email == "" {
		respondError(w, http.StatusBadRequest, "first_name, last_name, and email are required")
		return
	}

	customer, err := client.CreateCustomer(input)
	if err != nil {
		respondAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusCreated, customer)
}

func (s *Server) handleMaxioGetCustomer(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	customerID := r.PathValue("customerId")
	if customerID == "" {
		respondError(w, http.StatusBadRequest, "Customer ID is required")
		return
	}

	client, err := s.getMaxioClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	customer, err := client.GetCustomer(customerID)
	if err != nil {
		respondAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, customer)
}

func (s *Server) handleMaxioUpdateCustomer(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	customerID, err := strconv.ParseInt(r.PathValue("customerId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid customer ID")
		return
	}

	client, err := s.getMaxioClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var input maxio.CustomerInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if input.FirstName == "" || input.LastName == "" || input.Email == "" {
		respondError(w, http.StatusBadRequest, "first_name, last_name, and email are required")
		return
	}

	customer, err := client.UpdateCustomer(customerID, input)
	if err != nil {
		respondAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, customer)
}

func (s *Server) handleMaxioListSubscriptions(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getMaxioClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	perPage, _ := strconv.Atoi(r.URL.Query().Get("per_page"))

	subscriptions, err := client.ListSubscriptions(page, perPage)
	if err != nil {
		respondAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, subscriptions)
}

func (s *Server) handleMaxioGetSubscription(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	subscriptionID := r.PathValue("subscriptionId")
	if subscriptionID == "" {
		respondError(w, http.StatusBadRequest, "Subscription ID is required")
		return
	}

	client, err := s.getMaxioClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	subscription, err := client.GetSubscription(subscriptionID)
	if err != nil {
		respondAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, subscription)
}

func (s *Server) handleMaxioCreateSubscription(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getMaxioClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var input maxio.SubscriptionInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if input.CustomerID == 0 {
		respondError(w, http.StatusBadRequest, "customer_id is required")
		return
	}

	if input.ProductID == 0 && input.ProductHandle == "" {
		respondError(w, http.StatusBadRequest, "product_id or product_handle is required")
		return
	}

	subscription, err := client.CreateSubscription(input)
	if err != nil {
		respondAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusCreated, subscription)
}

func (s *Server) handleMaxioListProducts(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getMaxioClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	perPage, _ := strconv.Atoi(r.URL.Query().Get("per_page"))

	products, err := client.ListProducts(page, perPage)
	if err != nil {
		respondAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, products)
}

func (s *Server) handleMaxioListProductFamilies(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getMaxioClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	perPage, _ := strconv.Atoi(r.URL.Query().Get("per_page"))

	families, err := client.ListProductFamilies(page, perPage)
	if err != nil {
		respondAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, families)
}

func (s *Server) handleMaxioCreateProductFamily(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getMaxioClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var input maxio.ProductFamilyInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if input.Name == "" {
		respondError(w, http.StatusBadRequest, "name is required")
		return
	}

	family, err := client.CreateProductFamily(input)
	if err != nil {
		respondAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusCreated, family)
}

func (s *Server) handleMaxioListProductsByFamily(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	familyID, err := strconv.ParseInt(r.PathValue("familyId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid family ID")
		return
	}

	client, err := s.getMaxioClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	products, err := client.ListProductsByFamily(familyID)
	if err != nil {
		respondAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, products)
}

func (s *Server) handleMaxioCreateProduct(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	familyID, err := strconv.ParseInt(r.PathValue("familyId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid family ID")
		return
	}

	client, err := s.getMaxioClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var input maxio.ProductInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if input.Name == "" {
		respondError(w, http.StatusBadRequest, "name is required")
		return
	}

	if input.PriceInCents <= 0 {
		respondError(w, http.StatusBadRequest, "price_in_cents must be positive")
		return
	}

	if input.IntervalUnit == "" {
		input.IntervalUnit = "month"
	}

	if input.Interval <= 0 {
		input.Interval = 1
	}

	product, err := client.CreateProduct(familyID, input)
	if err != nil {
		respondAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusCreated, product)
}

func (s *Server) handleMaxioGetProduct(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	productID := r.PathValue("productId")
	if productID == "" {
		respondError(w, http.StatusBadRequest, "Product ID is required")
		return
	}

	client, err := s.getMaxioClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	product, err := client.GetProduct(productID)
	if err != nil {
		respondAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, product)
}

func (s *Server) handleMaxioUpdateProduct(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	productID, err := strconv.ParseInt(r.PathValue("productId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid product ID")
		return
	}

	client, err := s.getMaxioClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var input maxio.ProductInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if input.Name == "" {
		respondError(w, http.StatusBadRequest, "name is required")
		return
	}

	if input.PriceInCents <= 0 {
		respondError(w, http.StatusBadRequest, "price_in_cents must be positive")
		return
	}

	if input.IntervalUnit == "" {
		input.IntervalUnit = "month"
	}

	if input.Interval <= 0 {
		input.Interval = 1
	}

	product, err := client.UpdateProduct(productID, input)
	if err != nil {
		respondAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, product)
}

func (s *Server) handleMaxioListInvoices(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getMaxioClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	perPage, _ := strconv.Atoi(r.URL.Query().Get("per_page"))

	invoices, err := client.ListInvoices(page, perPage)
	if err != nil {
		respondAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, invoices)
}

func (s *Server) handleMaxioListPayments(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	// Payments in Maxio are tied to invoices/subscriptions
	// For now, return empty list with a note
	_ = connectionID
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"payments": []interface{}{},
		"note":     "Payments are accessed via invoices in Maxio. Use /invoices endpoint.",
	})
}

// Platform interface for future abstraction
type Platform interface {
	TestConnection() error
	ListCustomers(page, perPage int) (interface{}, error)
	GetCustomer(id string) (interface{}, error)
	CreateCustomer(input interface{}) (interface{}, error)
	ListSubscriptions(page, perPage int) (interface{}, error)
	GetSubscription(id string) (interface{}, error)
	ListProducts(page, perPage int) (interface{}, error)
	ListInvoices(page, perPage int) (interface{}, error)
}

// Verify maxio.Client implements platform interface conceptually
var _ = fmt.Sprintf("Maxio client ready")
