package api

import (
	"errors"
	"net/http"
	"sort"
	"strconv"

	"github.com/davealexenglish/payment-billing-hub/backend/internal/platforms/zuora"
)

// respondZuoraAPIError handles errors from the Zuora API
func respondZuoraAPIError(w http.ResponseWriter, err error) {
	var apiErr *zuora.APIError
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

// CustomerFromZuoraAccount converts a Zuora Account to the frontend Customer format
type CustomerFromZuora struct {
	ID           string `json:"id"`
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	Email        string `json:"email"`
	Organization string `json:"organization,omitempty"`
	Reference    string `json:"reference,omitempty"`
	CreatedAt    string `json:"created_at,omitempty"`
}

func accountToCustomer(account zuora.Account) CustomerFromZuora {
	customer := CustomerFromZuora{
		ID:           account.ID,
		Organization: account.Name,
		Reference:    account.AccountNumber,
	}
	if account.BillToContact != nil {
		customer.FirstName = account.BillToContact.FirstName
		customer.LastName = account.BillToContact.LastName
		customer.Email = account.BillToContact.WorkEmail
	}
	if account.CreatedDate != nil {
		customer.CreatedAt = account.CreatedDate.Format("2006-01-02T15:04:05Z")
	}
	return customer
}

// SubscriptionFromZuora converts Zuora Subscription to frontend format
type SubscriptionFromZuora struct {
	ID                  string `json:"id"`
	State               string `json:"state"`
	CurrentPeriodEndsAt string `json:"current_period_ends_at,omitempty"`
	ActivatedAt         string `json:"activated_at,omitempty"`
	CreatedAt           string `json:"created_at,omitempty"`
}

func subscriptionToFrontend(sub zuora.Subscription) SubscriptionFromZuora {
	result := SubscriptionFromZuora{
		ID:    sub.ID,
		State: sub.Status,
	}
	if sub.TermEndDate != "" {
		result.CurrentPeriodEndsAt = sub.TermEndDate
	}
	if sub.ServiceActivationDate != "" {
		result.ActivatedAt = sub.ServiceActivationDate
	}
	if sub.CreatedDate != nil {
		result.CreatedAt = sub.CreatedDate.Format("2006-01-02T15:04:05Z")
	}
	return result
}

// ProductFamilyFromZuora converts Zuora Product to frontend ProductFamily format
type ProductFamilyFromZuora struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Handle      string `json:"handle,omitempty"`
	Description string `json:"description,omitempty"`
	CreatedAt   string `json:"created_at,omitempty"`
}

func productToProductFamily(product zuora.Product) ProductFamilyFromZuora {
	result := ProductFamilyFromZuora{
		ID:          product.ID,
		Name:        product.Name,
		Handle:      product.SKU,
		Description: product.Description,
	}
	if product.CreatedDate != nil {
		result.CreatedAt = product.CreatedDate.Format("2006-01-02T15:04:05Z")
	}
	return result
}

// ProductFromZuora converts Zuora ProductRatePlan to frontend Product format
type ProductFromZuora struct {
	ID            string                  `json:"id"`
	Name          string                  `json:"name"`
	Handle        string                  `json:"handle,omitempty"`
	Description   string                  `json:"description,omitempty"`
	PriceInCents  int64                   `json:"price_in_cents"`
	Interval      int                     `json:"interval"`
	IntervalUnit  string                  `json:"interval_unit"`
	ProductFamily *ProductFamilyFromZuora `json:"product_family,omitempty"`
}

func ratePlanToProduct(ratePlan zuora.ProductRatePlan) ProductFromZuora {
	return ProductFromZuora{
		ID:           ratePlan.ID,
		Name:         ratePlan.Name,
		Description:  ratePlan.Description,
		PriceInCents: 0, // Rate plan pricing is more complex in Zuora
		Interval:     1,
		IntervalUnit: "month",
	}
}

// InvoiceFromZuora converts Zuora Invoice to frontend format
type InvoiceFromZuora struct {
	UID         string `json:"uid"`
	Number      string `json:"number"`
	CustomerID  string `json:"customer_id"`
	Status      string `json:"status"`
	TotalAmount string `json:"total_amount,omitempty"`
	DueDate     string `json:"due_date,omitempty"`
	CreatedAt   string `json:"created_at,omitempty"`
}

func invoiceToFrontend(invoice zuora.Invoice) InvoiceFromZuora {
	result := InvoiceFromZuora{
		UID:        invoice.ID,
		Number:     invoice.InvoiceNumber,
		CustomerID: invoice.AccountID,
		Status:     invoice.Status,
		DueDate:    invoice.DueDate,
	}
	if invoice.Amount != 0 {
		result.TotalAmount = strconv.FormatFloat(invoice.Amount, 'f', 2, 64)
	}
	if invoice.CreatedDate != nil {
		result.CreatedAt = invoice.CreatedDate.Format("2006-01-02T15:04:05Z")
	}
	return result
}

// Handlers

func (s *Server) handleZuoraListAccounts(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getZuoraClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))

	accounts, err := client.ListAccounts(page, pageSize)
	if err != nil {
		respondZuoraAPIError(w, err)
		return
	}

	// Convert to frontend format
	customers := make([]CustomerFromZuora, len(accounts))
	for i, account := range accounts {
		customers[i] = accountToCustomer(account)
	}

	// Sort by organization name (ascending)
	sort.Slice(customers, func(i, j int) bool {
		return customers[i].Organization < customers[j].Organization
	})

	respondJSON(w, http.StatusOK, customers)
}

func (s *Server) handleZuoraGetAccount(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	accountID := r.PathValue("accountId")
	if accountID == "" {
		respondError(w, http.StatusBadRequest, "Account ID is required")
		return
	}

	client, err := s.getZuoraClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	account, err := client.GetAccount(accountID)
	if err != nil {
		respondZuoraAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, accountToCustomer(*account))
}

func (s *Server) handleZuoraListSubscriptions(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getZuoraClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))

	subscriptions, err := client.ListSubscriptions(page, pageSize)
	if err != nil {
		respondZuoraAPIError(w, err)
		return
	}

	// Convert to frontend format
	result := make([]SubscriptionFromZuora, len(subscriptions))
	for i, sub := range subscriptions {
		result[i] = subscriptionToFrontend(sub)
	}

	respondJSON(w, http.StatusOK, result)
}

func (s *Server) handleZuoraGetSubscription(w http.ResponseWriter, r *http.Request) {
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

	client, err := s.getZuoraClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	subscription, err := client.GetSubscription(subscriptionID)
	if err != nil {
		respondZuoraAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, subscriptionToFrontend(*subscription))
}

func (s *Server) handleZuoraListProducts(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getZuoraClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))

	products, err := client.ListProducts(page, pageSize)
	if err != nil {
		respondZuoraAPIError(w, err)
		return
	}

	// Convert to frontend ProductFamily format (Products in Zuora map to ProductFamilies in frontend)
	result := make([]ProductFamilyFromZuora, len(products))
	for i, product := range products {
		result[i] = productToProductFamily(product)
	}

	respondJSON(w, http.StatusOK, result)
}

func (s *Server) handleZuoraGetProduct(w http.ResponseWriter, r *http.Request) {
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

	client, err := s.getZuoraClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	product, err := client.GetProduct(productID)
	if err != nil {
		respondZuoraAPIError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, productToProductFamily(*product))
}

func (s *Server) handleZuoraListProductRatePlans(w http.ResponseWriter, r *http.Request) {
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

	client, err := s.getZuoraClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	ratePlans, err := client.ListProductRatePlans(productID)
	if err != nil {
		respondZuoraAPIError(w, err)
		return
	}

	// Convert to frontend Product format (ProductRatePlans in Zuora map to Products in frontend)
	result := make([]ProductFromZuora, len(ratePlans))
	for i, ratePlan := range ratePlans {
		result[i] = ratePlanToProduct(ratePlan)
	}

	respondJSON(w, http.StatusOK, result)
}

func (s *Server) handleZuoraListInvoices(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getZuoraClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))

	invoices, err := client.ListInvoices(page, pageSize)
	if err != nil {
		respondZuoraAPIError(w, err)
		return
	}

	// Convert to frontend format
	result := make([]InvoiceFromZuora, len(invoices))
	for i, invoice := range invoices {
		result[i] = invoiceToFrontend(invoice)
	}

	respondJSON(w, http.StatusOK, result)
}

// PaymentFromZuora converts Zuora Payment to frontend format
type PaymentFromZuora struct {
	ID            string `json:"id"`
	TransactionID string `json:"transaction_id,omitempty"`
	AmountInCents int64  `json:"amount_in_cents"`
	Status        string `json:"status,omitempty"`
	PaymentDate   string `json:"payment_date,omitempty"`
	CreatedAt     string `json:"created_at,omitempty"`
}

func paymentToFrontend(payment zuora.Payment) PaymentFromZuora {
	result := PaymentFromZuora{
		ID:            payment.ID,
		TransactionID: payment.PaymentNumber,
		AmountInCents: int64(payment.Amount * 100),
		Status:        payment.Status,
		PaymentDate:   payment.EffectiveDate,
	}
	if payment.CreatedDate != nil {
		result.CreatedAt = payment.CreatedDate.Format("2006-01-02T15:04:05Z")
	}
	return result
}

func (s *Server) handleZuoraListPayments(w http.ResponseWriter, r *http.Request) {
	connectionID, err := strconv.ParseInt(r.PathValue("connectionId"), 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getZuoraClient(connectionID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))

	payments, err := client.ListPayments(page, pageSize)
	if err != nil {
		respondZuoraAPIError(w, err)
		return
	}

	// Convert to frontend format
	result := make([]PaymentFromZuora, len(payments))
	for i, payment := range payments {
		result[i] = paymentToFrontend(payment)
	}

	respondJSON(w, http.StatusOK, result)
}
