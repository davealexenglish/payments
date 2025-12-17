package api

import (
	"encoding/json"
	"net/http"

	"github.com/davealexenglish/payment-billing-hub/backend/internal/db"
	"github.com/davealexenglish/payment-billing-hub/backend/internal/platforms/maxio"
)

// Server holds the API server state
type Server struct {
	db           *db.DB
	maxioClients map[int64]*maxio.Client // connection_id -> client
}

// NewServer creates a new API server
func NewServer(database *db.DB) *Server {
	return &Server{
		db:           database,
		maxioClients: make(map[int64]*maxio.Client),
	}
}

// Router returns the HTTP router with all routes configured
func (s *Server) Router() http.Handler {
	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("GET /health", s.handleHealth)

	// Platform Connections
	mux.HandleFunc("GET /api/connections", s.handleListConnections)
	mux.HandleFunc("POST /api/connections", s.handleCreateConnection)
	mux.HandleFunc("GET /api/connections/{id}", s.handleGetConnection)
	mux.HandleFunc("PUT /api/connections/{id}", s.handleUpdateConnection)
	mux.HandleFunc("DELETE /api/connections/{id}", s.handleDeleteConnection)
	mux.HandleFunc("POST /api/connections/{id}/test", s.handleTestConnection)

	// Tree structure
	mux.HandleFunc("GET /api/tree", s.handleGetTree)

	// Maxio-specific endpoints
	mux.HandleFunc("GET /api/maxio/{connectionId}/customers", s.handleMaxioListCustomers)
	mux.HandleFunc("POST /api/maxio/{connectionId}/customers", s.handleMaxioCreateCustomer)
	mux.HandleFunc("GET /api/maxio/{connectionId}/customers/{customerId}", s.handleMaxioGetCustomer)
	mux.HandleFunc("GET /api/maxio/{connectionId}/subscriptions", s.handleMaxioListSubscriptions)
	mux.HandleFunc("POST /api/maxio/{connectionId}/subscriptions", s.handleMaxioCreateSubscription)
	mux.HandleFunc("GET /api/maxio/{connectionId}/subscriptions/{subscriptionId}", s.handleMaxioGetSubscription)
	mux.HandleFunc("GET /api/maxio/{connectionId}/products", s.handleMaxioListProducts)
	mux.HandleFunc("GET /api/maxio/{connectionId}/product-families", s.handleMaxioListProductFamilies)
	mux.HandleFunc("POST /api/maxio/{connectionId}/product-families", s.handleMaxioCreateProductFamily)
	mux.HandleFunc("GET /api/maxio/{connectionId}/product-families/{familyId}/products", s.handleMaxioListProductsByFamily)
	mux.HandleFunc("POST /api/maxio/{connectionId}/product-families/{familyId}/products", s.handleMaxioCreateProduct)
	mux.HandleFunc("GET /api/maxio/{connectionId}/invoices", s.handleMaxioListInvoices)
	mux.HandleFunc("GET /api/maxio/{connectionId}/payments", s.handleMaxioListPayments)

	// User preferences
	mux.HandleFunc("GET /api/preferences/{key}", s.handleGetPreference)
	mux.HandleFunc("PUT /api/preferences/{key}", s.handleUpdatePreference)

	// Wrap with CORS middleware
	return corsMiddleware(mux)
}

// corsMiddleware adds CORS headers for development
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// JSON response helpers
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{"error": message})
}

// Health check handler
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
