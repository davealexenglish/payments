package api

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/davealexenglish/payment-billing-hub/backend/internal/models"
	"github.com/davealexenglish/payment-billing-hub/backend/internal/platforms/maxio"
	"github.com/davealexenglish/payment-billing-hub/backend/internal/platforms/stripe"
	"github.com/davealexenglish/payment-billing-hub/backend/internal/platforms/zuora"
)

// Connection handlers

func (s *Server) handleListConnections(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Pool().Query(context.Background(), `
		SELECT id, platform_type, name, COALESCE(subdomain, ''), COALESCE(base_url, ''), is_sandbox, status, COALESCE(error_message, ''), last_sync_at, created_at, updated_at
		FROM platform_connections
		ORDER BY name
	`)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var connections []models.PlatformConnection
	for rows.Next() {
		var conn models.PlatformConnection
		err := rows.Scan(
			&conn.ID, &conn.PlatformType, &conn.Name, &conn.Subdomain, &conn.BaseURL,
			&conn.IsSandbox, &conn.Status, &conn.ErrorMessage, &conn.LastSyncAt,
			&conn.CreatedAt, &conn.UpdatedAt,
		)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		connections = append(connections, conn)
	}

	respondJSON(w, http.StatusOK, connections)
}

func (s *Server) handleCreateConnection(w http.ResponseWriter, r *http.Request) {
	var req models.CreateConnectionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Name == "" {
		respondError(w, http.StatusBadRequest, "Name is required")
		return
	}

	// Validate credentials based on platform type
	switch req.PlatformType {
	case models.PlatformMaxio:
		if req.APIKey == "" {
			respondError(w, http.StatusBadRequest, "API key is required for Maxio")
			return
		}
	case models.PlatformZuora:
		if req.ClientID == "" || req.ClientSecret == "" {
			respondError(w, http.StatusBadRequest, "Client ID and Client Secret are required for Zuora")
			return
		}
	case models.PlatformStripe:
		if req.APIKey == "" {
			respondError(w, http.StatusBadRequest, "API key is required for Stripe")
			return
		}
	}

	ctx := context.Background()
	tx, err := s.db.Pool().Begin(ctx)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer tx.Rollback(ctx)

	// Insert connection
	var connID int64
	err = tx.QueryRow(ctx, `
		INSERT INTO platform_connections (platform_type, name, subdomain, base_url, is_sandbox, status)
		VALUES ($1, $2, $3, $4, $5, 'pending')
		RETURNING id
	`, req.PlatformType, req.Name, req.Subdomain, req.BaseURL, req.IsSandbox).Scan(&connID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Insert credentials based on platform type
	switch req.PlatformType {
	case models.PlatformMaxio, models.PlatformStripe:
		_, err = tx.Exec(ctx, `
			INSERT INTO platform_credentials (connection_id, credential_type, credential_value)
			VALUES ($1, 'api_key', $2)
		`, connID, req.APIKey)
	case models.PlatformZuora:
		_, err = tx.Exec(ctx, `
			INSERT INTO platform_credentials (connection_id, credential_type, credential_value)
			VALUES ($1, 'client_id', $2)
		`, connID, req.ClientID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		_, err = tx.Exec(ctx, `
			INSERT INTO platform_credentials (connection_id, credential_type, credential_value)
			VALUES ($1, 'client_secret', $2)
		`, connID, req.ClientSecret)
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := tx.Commit(ctx); err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Return the created connection
	var conn models.PlatformConnection
	err = s.db.Pool().QueryRow(ctx, `
		SELECT id, platform_type, name, COALESCE(subdomain, ''), COALESCE(base_url, ''), is_sandbox, status, COALESCE(error_message, ''), last_sync_at, created_at, updated_at
		FROM platform_connections WHERE id = $1
	`, connID).Scan(
		&conn.ID, &conn.PlatformType, &conn.Name, &conn.Subdomain, &conn.BaseURL,
		&conn.IsSandbox, &conn.Status, &conn.ErrorMessage, &conn.LastSyncAt,
		&conn.CreatedAt, &conn.UpdatedAt,
	)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, conn)
}

func (s *Server) handleGetConnection(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	var conn models.PlatformConnection
	err = s.db.Pool().QueryRow(context.Background(), `
		SELECT id, platform_type, name, COALESCE(subdomain, ''), COALESCE(base_url, ''), is_sandbox, status, COALESCE(error_message, ''), last_sync_at, created_at, updated_at
		FROM platform_connections WHERE id = $1
	`, id).Scan(
		&conn.ID, &conn.PlatformType, &conn.Name, &conn.Subdomain, &conn.BaseURL,
		&conn.IsSandbox, &conn.Status, &conn.ErrorMessage, &conn.LastSyncAt,
		&conn.CreatedAt, &conn.UpdatedAt,
	)
	if err != nil {
		respondError(w, http.StatusNotFound, "Connection not found")
		return
	}

	respondJSON(w, http.StatusOK, conn)
}

func (s *Server) handleUpdateConnection(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	var req struct {
		Name      string `json:"name"`
		Subdomain string `json:"subdomain"`
		BaseURL   string `json:"base_url"`
		IsSandbox bool   `json:"is_sandbox"`
		APIKey    string `json:"api_key,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	ctx := context.Background()

	// Update connection
	_, err = s.db.Pool().Exec(ctx, `
		UPDATE platform_connections
		SET name = $1, subdomain = $2, base_url = $3, is_sandbox = $4, updated_at = NOW()
		WHERE id = $5
	`, req.Name, req.Subdomain, req.BaseURL, req.IsSandbox, id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Update API key if provided
	if req.APIKey != "" {
		_, err = s.db.Pool().Exec(ctx, `
			INSERT INTO platform_credentials (connection_id, credential_type, credential_value)
			VALUES ($1, 'api_key', $2)
			ON CONFLICT (connection_id, credential_type) DO UPDATE SET credential_value = $2
		`, id, req.APIKey)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		// Clear cached clients
		delete(s.maxioClients, id)
		delete(s.stripeClients, id)
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

func (s *Server) handleDeleteConnection(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	_, err = s.db.Pool().Exec(context.Background(), `DELETE FROM platform_connections WHERE id = $1`, id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	delete(s.maxioClients, id)
	delete(s.stripeClients, id)
	delete(s.zuoraClients, id)
	respondJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func (s *Server) handleTestConnection(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	// Get platform type
	var platformType string
	err = s.db.Pool().QueryRow(context.Background(), `
		SELECT platform_type FROM platform_connections WHERE id = $1
	`, id).Scan(&platformType)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Test connection based on platform type
	var testErr error
	switch platformType {
	case "maxio":
		client, err := s.getMaxioClient(id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		testErr = client.TestConnection()
	case "stripe":
		client, err := s.getStripeClient(id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		testErr = client.TestConnection()
	case "zuora":
		client, err := s.getZuoraClient(id)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		testErr = client.TestConnection()
	default:
		respondError(w, http.StatusBadRequest, "Unsupported platform type: "+platformType)
		return
	}

	if testErr != nil {
		// Update status to error
		s.db.Pool().Exec(context.Background(), `
			UPDATE platform_connections SET status = 'error', error_message = $1, updated_at = NOW()
			WHERE id = $2
		`, testErr.Error(), id)
		respondError(w, http.StatusBadRequest, testErr.Error())
		return
	}

	// Update status to connected
	s.db.Pool().Exec(context.Background(), `
		UPDATE platform_connections SET status = 'connected', error_message = NULL, updated_at = NOW()
		WHERE id = $1
	`, id)

	respondJSON(w, http.StatusOK, map[string]string{"status": "connected"})
}

// Tree handler
func (s *Server) handleGetTree(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Pool().Query(context.Background(), `
		SELECT id, platform_type, name, status
		FROM platform_connections
		ORDER BY name
	`)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	// Create the three vendor root nodes
	vendorNodes := map[string]*models.TreeNode{
		"maxio": {
			ID:           "vendor-maxio",
			Type:         "vendor-maxio",
			Name:         "Maxio (Chargify)",
			PlatformType: "maxio",
			IsExpandable: true,
			Children:     []*models.TreeNode{},
		},
		"stripe": {
			ID:           "vendor-stripe",
			Type:         "vendor-stripe",
			Name:         "Stripe",
			PlatformType: "stripe",
			IsExpandable: true,
			Children:     []*models.TreeNode{},
		},
		"zuora": {
			ID:           "vendor-zuora",
			Type:         "vendor-zuora",
			Name:         "Zuora",
			PlatformType: "zuora",
			IsExpandable: true,
			Children:     []*models.TreeNode{},
		},
	}

	for rows.Next() {
		var id int64
		var platformType, name, status string
		if err := rows.Scan(&id, &platformType, &name, &status); err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}

		// Create connection node with entity containers
		children := []*models.TreeNode{
			{
				ID:           "customers-" + strconv.FormatInt(id, 10),
				Type:         "customers",
				Name:         "Customers",
				ConnectionID: &id,
				PlatformType: platformType,
				IsExpandable: true,
			},
			{
				ID:           "subscriptions-" + strconv.FormatInt(id, 10),
				Type:         "subscriptions",
				Name:         "Subscriptions",
				ConnectionID: &id,
				PlatformType: platformType,
				IsExpandable: true,
			},
			{
				ID:           "product-families-" + strconv.FormatInt(id, 10),
				Type:         "product-families",
				Name:         "Product Families",
				ConnectionID: &id,
				PlatformType: platformType,
				IsExpandable: true,
			},
			{
				ID:           "invoices-" + strconv.FormatInt(id, 10),
				Type:         "invoices",
				Name:         "Invoices",
				ConnectionID: &id,
				PlatformType: platformType,
				IsExpandable: true,
			},
			{
				ID:           "payments-" + strconv.FormatInt(id, 10),
				Type:         "payments",
				Name:         "Payments",
				ConnectionID: &id,
				PlatformType: platformType,
				IsExpandable: true,
			},
		}

		// Add Stripe-specific containers
		if platformType == "stripe" {
			children = append(children, &models.TreeNode{
				ID:           "coupons-" + strconv.FormatInt(id, 10),
				Type:         "coupons",
				Name:         "Coupons",
				ConnectionID: &id,
				PlatformType: platformType,
				IsExpandable: true,
			})
		}

		connectionNode := &models.TreeNode{
			ID:           "connection-" + strconv.FormatInt(id, 10),
			Type:         "connection",
			Name:         name,
			ConnectionID: &id,
			PlatformType: platformType,
			IsExpandable: true,
			Children:     children,
		}

		// Add connection to the appropriate vendor node
		if vendorNode, ok := vendorNodes[platformType]; ok {
			vendorNode.Children = append(vendorNode.Children, connectionNode)
		}
	}

	// Return the three vendor root nodes in order
	tree := []*models.TreeNode{
		vendorNodes["maxio"],
		vendorNodes["stripe"],
		vendorNodes["zuora"],
	}

	respondJSON(w, http.StatusOK, tree)
}

// Preference handlers
func (s *Server) handleGetPreference(w http.ResponseWriter, r *http.Request) {
	key := r.PathValue("key")

	var value json.RawMessage
	err := s.db.Pool().QueryRow(context.Background(), `
		SELECT preference_value FROM user_preferences WHERE preference_key = $1
	`, key).Scan(&value)
	if err != nil {
		respondError(w, http.StatusNotFound, "Preference not found")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(value)
}

func (s *Server) handleUpdatePreference(w http.ResponseWriter, r *http.Request) {
	key := r.PathValue("key")

	var value json.RawMessage
	if err := json.NewDecoder(r.Body).Decode(&value); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	_, err := s.db.Pool().Exec(context.Background(), `
		INSERT INTO user_preferences (preference_key, preference_value)
		VALUES ($1, $2)
		ON CONFLICT (preference_key) DO UPDATE SET preference_value = $2, updated_at = NOW()
	`, key, value)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

// Helper to get or create Maxio client
func (s *Server) getMaxioClient(connectionID int64) (*maxio.Client, error) {
	if client, ok := s.maxioClients[connectionID]; ok {
		return client, nil
	}

	ctx := context.Background()

	// Get connection details
	var subdomain string
	err := s.db.Pool().QueryRow(ctx, `
		SELECT subdomain FROM platform_connections WHERE id = $1 AND platform_type = 'maxio'
	`, connectionID).Scan(&subdomain)
	if err != nil {
		return nil, err
	}

	// Get API key
	var apiKey string
	err = s.db.Pool().QueryRow(ctx, `
		SELECT credential_value FROM platform_credentials
		WHERE connection_id = $1 AND credential_type = 'api_key'
	`, connectionID).Scan(&apiKey)
	if err != nil {
		return nil, err
	}

	client := maxio.NewClient(subdomain, apiKey)
	s.maxioClients[connectionID] = client
	return client, nil
}

// Helper to get or create Zuora client
func (s *Server) getZuoraClient(connectionID int64) (*zuora.Client, error) {
	if client, ok := s.zuoraClients[connectionID]; ok {
		return client, nil
	}

	ctx := context.Background()

	// Get connection details including base_url
	var baseURL string
	var isSandbox bool
	err := s.db.Pool().QueryRow(ctx, `
		SELECT COALESCE(base_url, ''), is_sandbox FROM platform_connections WHERE id = $1 AND platform_type = 'zuora'
	`, connectionID).Scan(&baseURL, &isSandbox)
	if err != nil {
		return nil, err
	}

	// Fall back to default URLs if base_url is not set
	if baseURL == "" {
		if isSandbox {
			baseURL = "https://rest.sandbox.na.zuora.com"
		} else {
			baseURL = "https://rest.na.zuora.com"
		}
	}

	// Get client_id
	var clientID string
	err = s.db.Pool().QueryRow(ctx, `
		SELECT credential_value FROM platform_credentials
		WHERE connection_id = $1 AND credential_type = 'client_id'
	`, connectionID).Scan(&clientID)
	if err != nil {
		return nil, err
	}

	// Get client_secret
	var clientSecret string
	err = s.db.Pool().QueryRow(ctx, `
		SELECT credential_value FROM platform_credentials
		WHERE connection_id = $1 AND credential_type = 'client_secret'
	`, connectionID).Scan(&clientSecret)
	if err != nil {
		return nil, err
	}

	client := zuora.NewClient(baseURL, clientID, clientSecret)
	s.zuoraClients[connectionID] = client
	return client, nil
}

// Helper to get or create Stripe client
func (s *Server) getStripeClient(connectionID int64) (*stripe.Client, error) {
	if client, ok := s.stripeClients[connectionID]; ok {
		return client, nil
	}

	ctx := context.Background()

	// Get API key
	var apiKey string
	err := s.db.Pool().QueryRow(ctx, `
		SELECT credential_value FROM platform_credentials
		WHERE connection_id = $1 AND credential_type = 'api_key'
	`, connectionID).Scan(&apiKey)
	if err != nil {
		return nil, err
	}

	client := stripe.NewClient(apiKey)
	s.stripeClients[connectionID] = client
	return client, nil
}
