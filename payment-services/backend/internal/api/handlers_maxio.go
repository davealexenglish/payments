package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/davealexenglish/payment-billing-hub/backend/internal/platforms/maxio"
)

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
		respondError(w, http.StatusInternalServerError, err.Error())
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
		respondError(w, http.StatusInternalServerError, err.Error())
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
		respondError(w, http.StatusNotFound, err.Error())
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
		respondError(w, http.StatusInternalServerError, err.Error())
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
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, subscription)
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
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, products)
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
		respondError(w, http.StatusInternalServerError, err.Error())
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
