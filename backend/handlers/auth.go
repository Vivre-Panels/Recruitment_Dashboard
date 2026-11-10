package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"net/mail"
	"strings"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"recruitment-dashboard/backend/auth"
	"recruitment-dashboard/backend/config"
	"recruitment-dashboard/backend/database"
)

type AuthHandler struct{ config *config.Config }

func NewAuthHandler(cfg *config.Config) *AuthHandler { return &AuthHandler{config: cfg} }

type credentialsInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) Login(c *gin.Context) {
	var input credentialsInput
	if c.ShouldBindJSON(&input) != nil {
		authFailure(c, http.StatusBadRequest, "Enter your email and password.")
		return
	}
	email := normalizeEmail(input.Email)
	var account struct {
		ID            int            `db:"id"`
		RecruiterID   sql.NullInt64  `db:"recruiter_id"`
		Email         string         `db:"email"`
		PasswordHash  string         `db:"password_hash"`
		Role          string         `db:"role"`
		RecruiterName sql.NullString `db:"recruiter_name"`
	}
	err := database.DB.Get(&account, `SELECT TOP (1) du.[id], du.[recruiter_id], du.[email], du.[password_hash], du.[role], r.[recruiter_name]
		FROM [dbo].[dashboard_users] du LEFT JOIN [dbo].[recruiters] r ON r.[recruiter_id] = du.[recruiter_id]
		WHERE LOWER(LTRIM(RTRIM(du.[email]))) = @p1 AND du.[is_active] = 1
		AND (du.[role] = 'superadmin' OR LOWER(LTRIM(RTRIM(r.[status]))) = 'active')`, email)
	if err != nil || bcrypt.CompareHashAndPassword([]byte(account.PasswordHash), []byte(input.Password)) != nil {
		authFailure(c, http.StatusUnauthorized, "Email or password is incorrect.")
		return
	}
	var recruiterID *int
	if account.RecruiterID.Valid {
		value := int(account.RecruiterID.Int64)
		recruiterID = &value
	}
	h.completeLogin(c, auth.Session{UserID: account.ID, RecruiterID: recruiterID, RecruiterName: account.RecruiterName.String, Email: account.Email, Role: account.Role})
}

func (h *AuthHandler) Me(c *gin.Context) {
	session, ok := auth.Current(c)
	if !ok {
		authFailure(c, http.StatusUnauthorized, "Please sign in to continue.")
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "user": session})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	auth.ClearCookie(c, h.config.AuthCookieSecure)
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *AuthHandler) BootstrapSuperadmin() error {
	email := normalizeEmail(h.config.SuperadminEmail)
	if email == "" && h.config.SuperadminPassword == "" {
		return nil
	}
	if !validEmail(email) || utf8.RuneCountInString(h.config.SuperadminPassword) < 6 || utf8.RuneCountInString(h.config.SuperadminPassword) > 12 {
		return errors.New("SUPERADMIN_EMAIL and a 6-12 character SUPERADMIN_PASSWORD must both be configured")
	}
	var recruiterCount int
	if err := database.DB.Get(&recruiterCount, `SELECT COUNT(*) FROM [dbo].[recruiters] WHERE LOWER(LTRIM(RTRIM([email]))) = @p1`, email); err != nil {
		return err
	}
	if recruiterCount > 0 {
		return errors.New("SUPERADMIN_EMAIL must be separate from every recruiter directory email")
	}
	var userID int
	err := database.DB.Get(&userID, `SELECT [id] FROM [dbo].[dashboard_users] WHERE LOWER(LTRIM(RTRIM([email]))) = @p1`, email)
	if err == nil {
		var role string
		if roleErr := database.DB.Get(&role, `SELECT [role] FROM [dbo].[dashboard_users] WHERE [id] = @p1`, userID); roleErr != nil {
			return roleErr
		}
		if role != "superadmin" {
			return errors.New("configured SUPERADMIN_EMAIL already belongs to a non-superadmin account")
		}
		return nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(h.config.SuperadminPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	_, err = database.DB.Exec(`INSERT INTO [dbo].[dashboard_users] ([recruiter_id], [email], [password_hash], [role]) VALUES (NULL, @p1, @p2, 'superadmin')`, email, string(hash))
	return err
}

func CreateSuperadmin(c *gin.Context) {
	var input credentialsInput
	if c.ShouldBindJSON(&input) != nil {
		authFailure(c, http.StatusBadRequest, "Enter a valid email and password.")
		return
	}
	email := normalizeEmail(input.Email)
	passwordLength := utf8.RuneCountInString(input.Password)
	if !validEmail(email) || passwordLength < 6 || passwordLength > 12 {
		authFailure(c, http.StatusBadRequest, "Use a valid email and a password between 6 and 12 characters.")
		return
	}
	var recruiterCount int
	if err := database.DB.Get(&recruiterCount, `SELECT COUNT(*) FROM [dbo].[recruiters] WHERE LOWER(LTRIM(RTRIM([email]))) = @p1`, email); err != nil {
		authFailure(c, http.StatusInternalServerError, "Could not verify the email address.")
		return
	}
	if recruiterCount > 0 {
		authFailure(c, http.StatusConflict, "Use an email that is not assigned to a recruiter account.")
		return
	}
	var accountCount int
	if err := database.DB.Get(&accountCount, `SELECT COUNT(*) FROM [dbo].[dashboard_users] WHERE LOWER(LTRIM(RTRIM([email]))) = @p1`, email); err != nil {
		authFailure(c, http.StatusInternalServerError, "Could not check existing dashboard accounts.")
		return
	}
	if accountCount > 0 {
		authFailure(c, http.StatusConflict, "A dashboard account already uses this email.")
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		authFailure(c, http.StatusInternalServerError, "Could not secure the password.")
		return
	}
	var userID int
	err = database.DB.QueryRow(`INSERT INTO [dbo].[dashboard_users] ([recruiter_id], [email], [password_hash], [role]) OUTPUT INSERTED.[id] VALUES (NULL, @p1, @p2, 'superadmin')`, email, string(hash)).Scan(&userID)
	if err != nil {
		authFailure(c, http.StatusConflict, "Could not create this superadmin account. The email may already be in use.")
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": gin.H{"id": userID, "email": email, "role": "superadmin"}})
}

func (h *AuthHandler) completeLogin(c *gin.Context, session auth.Session) {
	token, err := auth.Sign(session, h.config.AuthTokenSecret)
	if err != nil {
		authFailure(c, http.StatusInternalServerError, "Could not create a session.")
		return
	}
	auth.SetCookie(c, token, h.config.AuthCookieSecure)
	c.JSON(http.StatusOK, gin.H{"success": true, "user": session})
}

func normalizeEmail(value string) string { return strings.ToLower(strings.TrimSpace(value)) }

func validEmail(value string) bool {
	parsed, err := mail.ParseAddress(value)
	return err == nil && parsed.Address == value && strings.Contains(value, "@")
}

func authFailure(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{"success": false, "message": message})
}
