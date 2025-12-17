package api

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/davealexenglish/payment-billing-hub/backend/internal/models"
	"github.com/davealexenglish/payment-billing-hub/backend/internal/platforms/maxio"
)

// Connection handlers

func (s *Server) handleListConnections(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Pool().Query(context.Background(), `
		SELECT id, platform_type, name, COALESCE(subdomain, ''), is_sandbox, status, COALESCE(error_message, ''), last_sync_at, created_at, updated_at
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
			&conn.ID, &conn.PlatformType, &conn.Name, &conn.Subdomain,
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

	if req.Name == "" || req.APIKey == "" {
		respondError(w, http.StatusBadRequest, "Name and API key are required")
		return
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
		INSERT INTO platform_connections (platform_type, name, subdomain, is_sandbox, status)
		VALUES ($1, $2, $3, $4, 'pending')
		RETURNING id
	`, req.PlatformType, req.Name, req.Subdomain, req.IsSandbox).Scan(&connID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Insert API key credential
	_, err = tx.Exec(ctx, `
		INSERT INTO platform_credentials (connection_id, credential_type, credential_value)
		VALUES ($1, 'api_key', $2)
	`, connID, req.APIKey)
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
		SELECT id, platform_type, name, COALESCE(subdomain, ''), is_sandbox, status, COALESCE(error_message, ''), last_sync_at, created_at, updated_at
		FROM platform_connections WHERE id = $1
	`, connID).Scan(
		&conn.ID, &conn.PlatformType, &conn.Name, &conn.Subdomain,
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
		SELECT id, platform_type, name, COALESCE(subdomain, ''), is_sandbox, status, COALESCE(error_message, ''), last_sync_at, created_at, updated_at
		FROM platform_connections WHERE id = $1
	`, id).Scan(
		&conn.ID, &conn.PlatformType, &conn.Name, &conn.Subdomain,
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
		SET name = $1, subdomain = $2, is_sandbox = $3, updated_at = NOW()
		WHERE id = $4
	`, req.Name, req.Subdomain, req.IsSandbox, id)
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
		// Clear cached client
		delete(s.maxioClients, id)
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
	respondJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func (s *Server) handleTestConnection(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid connection ID")
		return
	}

	client, err := s.getMaxioClient(id)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := client.TestConnection(); err != nil {
		// Update status to error
		s.db.Pool().Exec(context.Background(), `
			UPDATE platform_connections SET status = 'error', error_message = $1, updated_at = NOW()
			WHERE id = $2
		`, err.Error(), id)
		respondError(w, http.StatusBadRequest, err.Error())
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

	var tree []*models.TreeNode

	for rows.Next() {
		var id int64
		var platformType, name, status string
		if err := rows.Scan(&id, &platformType, &name, &status); err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}

		// Create platform node with entity containers
		platformNode := &models.TreeNode{
			ID:           "platform-" + strconv.FormatInt(id, 10),
			Type:         "platform-" + platformType,
			Name:         name,
			ConnectionID: &id,
			PlatformType: platformType,
			IsExpandable: true,
			Children: []*models.TreeNode{
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
					ID:           "products-" + strconv.FormatInt(id, 10),
					Type:         "products",
					Name:         "Products",
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
			},
		}

		tree = append(tree, platformNode)
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
