package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/davealexenglish/payment-billing-hub/backend/internal/platforms/stripe"
)

// respondStripeAPIError handles errors from the Stripe API, returning appropriate HTTP status codes
func respondStripeAPIError(w http.ResponseWriter, err error) {
	var apiErr *stripe.APIError
	if errors.As(err, &apiErr) {
		statusCode := apiErr.StatusCode
		if statusCode < 400 || statusCode >= 600 {
			statusCode = http.StatusBadGateway
		}
		respondError(w, statusCode, apiErr.Message)
		return
	}
	respondError(w, http.StatusInternalServerError, err.Error())
}

func (s *Server) handleStripeListCustomers(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	startingAfter := r.URL.Query().Get("starting_after")

	result, err := client.ListCustomers(limit, startingAfter)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, result.Data)
}

func (s *Server) handleStripeGetCustomer(w http.ResponseWriter, r *http.Request) {
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

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	customer, err := client.GetCustomer(customerID)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, customer)
}

func (s *Server) handleStripeCreateCustomer(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var input stripe.CustomerInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	customer, err := client.CreateCustomer(input)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusCreated, customer)
}

func (s *Server) handleStripeUpdateCustomer(w http.ResponseWriter, r *http.Request) {
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

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var input stripe.CustomerInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	customer, err := client.UpdateCustomer(customerID, input)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, customer)
}

func (s *Server) handleStripeListSubscriptions(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	startingAfter := r.URL.Query().Get("starting_after")

	result, err := client.ListSubscriptions(limit, startingAfter)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, result.Data)
}

func (s *Server) handleStripeGetSubscription(w http.ResponseWriter, r *http.Request) {
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

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	subscription, err := client.GetSubscription(subscriptionID)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, subscription)
}

func (s *Server) handleStripeCreateProduct(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var input struct {
		Name        string `json:"name"`
		Description string `json:"description,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if input.Name == "" {
		respondError(w, http.StatusBadRequest, "name is required")
		return
	}

	product, err := client.CreateProduct(input.Name, input.Description)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusCreated, product)
}

func (s *Server) handleStripeListProducts(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	startingAfter := r.URL.Query().Get("starting_after")

	result, err := client.ListProducts(limit, startingAfter)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, result.Data)
}

func (s *Server) handleStripeGetProduct(w http.ResponseWriter, r *http.Request) {
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

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	product, err := client.GetProduct(productID)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, product)
}

func (s *Server) handleStripeListPrices(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	productID := r.URL.Query().Get("product")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	startingAfter := r.URL.Query().Get("starting_after")

	result, err := client.ListPrices(productID, limit, startingAfter)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, result.Data)
}

func (s *Server) handleStripeListInvoices(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	startingAfter := r.URL.Query().Get("starting_after")

	result, err := client.ListInvoices(limit, startingAfter)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, result.Data)
}

func (s *Server) handleStripeGetInvoice(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	invoiceID := r.PathValue("invoiceId")
	if invoiceID == "" {
		respondError(w, http.StatusBadRequest, "Invoice ID is required")
		return
	}

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	invoice, err := client.GetInvoice(invoiceID)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, invoice)
}

func (s *Server) handleStripeListPayments(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	startingAfter := r.URL.Query().Get("starting_after")

	// Use charges as payments (more commonly used than payment_intents for viewing payment history)
	result, err := client.ListCharges(limit, startingAfter)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, result.Data)
}

func (s *Server) handleStripeCreatePrice(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var input struct {
		ProductID     string `json:"product_id"`
		UnitAmount    int64  `json:"unit_amount"`
		Currency      string `json:"currency"`
		Interval      string `json:"interval"`
		IntervalCount int    `json:"interval_count"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if input.ProductID == "" {
		respondError(w, http.StatusBadRequest, "product_id is required")
		return
	}

	if input.UnitAmount <= 0 {
		respondError(w, http.StatusBadRequest, "unit_amount must be positive")
		return
	}

	if input.Currency == "" {
		input.Currency = "usd"
	}

	if input.IntervalCount <= 0 {
		input.IntervalCount = 1
	}

	price, err := client.CreatePrice(input.ProductID, input.UnitAmount, input.Currency, input.Interval, input.IntervalCount)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusCreated, price)
}

func (s *Server) handleStripeCreateSubscription(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var input stripe.SubscriptionInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if input.CustomerID == "" {
		respondError(w, http.StatusBadRequest, "customer_id is required")
		return
	}

	if input.PriceID == "" {
		respondError(w, http.StatusBadRequest, "price_id is required")
		return
	}

	// Validate collection_method
	if input.CollectionMethod != "" && input.CollectionMethod != "charge_automatically" && input.CollectionMethod != "send_invoice" {
		respondError(w, http.StatusBadRequest, "collection_method must be 'charge_automatically' or 'send_invoice'")
		return
	}

	// days_until_due required for send_invoice
	if input.CollectionMethod == "send_invoice" && input.DaysUntilDue <= 0 {
		input.DaysUntilDue = 30 // Default to 30 days
	}

	subscription, err := client.CreateSubscription(input)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusCreated, subscription)
}

// Coupon handlers

func (s *Server) handleStripeListCoupons(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	startingAfter := r.URL.Query().Get("starting_after")

	result, err := client.ListCoupons(limit, startingAfter)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, result.Data)
}

func (s *Server) handleStripeGetCoupon(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	couponID := r.PathValue("couponId")
	if couponID == "" {
		respondError(w, http.StatusBadRequest, "Coupon ID is required")
		return
	}

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	coupon, err := client.GetCoupon(couponID)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, coupon)
}

func (s *Server) handleStripeCreateCoupon(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var input stripe.CouponInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate duration
	if input.Duration == "" {
		respondError(w, http.StatusBadRequest, "duration is required (once, repeating, or forever)")
		return
	}
	if input.Duration != "once" && input.Duration != "repeating" && input.Duration != "forever" {
		respondError(w, http.StatusBadRequest, "duration must be 'once', 'repeating', or 'forever'")
		return
	}

	// Validate duration_in_months for repeating
	if input.Duration == "repeating" && input.DurationInMonths <= 0 {
		respondError(w, http.StatusBadRequest, "duration_in_months is required when duration is 'repeating'")
		return
	}

	// Validate discount (must have percent_off OR amount_off)
	if input.PercentOff <= 0 && input.AmountOff <= 0 {
		respondError(w, http.StatusBadRequest, "either percent_off or amount_off is required")
		return
	}

	// Validate percent_off range
	if input.PercentOff > 100 {
		respondError(w, http.StatusBadRequest, "percent_off cannot exceed 100")
		return
	}

	coupon, err := client.CreateCoupon(input)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusCreated, coupon)
}

func (s *Server) handleStripeUpdateCoupon(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	couponID := r.PathValue("couponId")
	if couponID == "" {
		respondError(w, http.StatusBadRequest, "Coupon ID is required")
		return
	}

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var input struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	coupon, err := client.UpdateCoupon(couponID, input.Name)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, coupon)
}

func (s *Server) handleStripeDeleteCoupon(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	couponID := r.PathValue("couponId")
	if couponID == "" {
		respondError(w, http.StatusBadRequest, "Coupon ID is required")
		return
	}

	client, err := s.getStripeClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	err = client.DeleteCoupon(couponID)
	if err != nil {
		respondStripeAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, map[string]bool{"deleted": true})
}
