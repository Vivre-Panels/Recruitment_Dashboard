package auth

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"recruitment-dashboard/backend/database"
)

const CookieName = "dashboard_session"

type Session struct {
	UserID        int    `json:"uid"`
	RecruiterID   *int   `json:"rid,omitempty"`
	Email         string `json:"email"`
	Role          string `json:"role"`
	RecruiterName string `json:"recruiter_name,omitempty"`
}

type tokenClaims struct {
	Session
	jwt.RegisteredClaims
}

func Sign(session Session, secret string) (string, error) {
	now := time.Now()
	claims := tokenClaims{Session: session, RegisteredClaims: jwt.RegisteredClaims{
		Issuer: "recruitment-dashboard", Subject: strconv.Itoa(session.UserID),
		IssuedAt: jwt.NewNumericDate(now), ExpiresAt: jwt.NewNumericDate(now.Add(8 * time.Hour)),
	}}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
}

func parse(token, secret string) (Session, bool) {
	claims := &tokenClaims{}
	parsed, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secret), nil
	}, jwt.WithValidMethods([]string{"HS256"}), jwt.WithIssuer("recruitment-dashboard"))
	if err != nil || !parsed.Valid || claims.UserID < 1 {
		return Session{}, false
	}
	session := claims.Session
	if session.Role != "superadmin" && session.Role != "recruiter" {
		return Session{}, false
	}
	if session.Role == "recruiter" && (session.RecruiterID == nil || *session.RecruiterID < 1) {
		return Session{}, false
	}
	return session, true
}

func Middleware(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Cache-Control", "no-store")
		cookie, err := c.Cookie(CookieName)
		if err != nil {
			unauthorized(c)
			return
		}
		session, valid := parse(cookie, secret)
		if !valid {
			unauthorized(c)
			return
		}
		var accountActive bool
		query := `SELECT CAST(CASE WHEN COUNT_BIG(1) = 1 THEN 1 ELSE 0 END AS BIT)
			FROM [dbo].[dashboard_users] du
			LEFT JOIN [dbo].[recruiters] r ON r.[recruiter_id] = du.[recruiter_id]
			WHERE du.[id] = @p1 AND du.[role] = @p2 AND du.[is_active] = 1
			AND ((du.[role] = 'superadmin' AND du.[recruiter_id] IS NULL) OR (du.[role] = 'recruiter' AND du.[recruiter_id] = @p3 AND LOWER(LTRIM(RTRIM(r.[status]))) = 'active'))`
		if database.DB == nil || database.DB.Get(&accountActive, query, session.UserID, session.Role, nullableInt(session.RecruiterID)) != nil || !accountActive {
			unauthorized(c)
			return
		}
		c.Set("auth_session", session)
		c.Next()
	}
}

func RequireRoles(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]bool, len(roles))
	for _, role := range roles {
		allowed[role] = true
	}
	return func(c *gin.Context) {
		session, ok := Current(c)
		if !ok || !allowed[session.Role] {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"success": false, "message": "You do not have permission to access this resource."})
			return
		}
		c.Next()
	}
}

func Current(c *gin.Context) (Session, bool) {
	value, ok := c.Get("auth_session")
	if !ok {
		return Session{}, false
	}
	session, ok := value.(Session)
	return session, ok
}

func RequireAllowedOrigin(origins []string) gin.HandlerFunc {
	allowed := make(map[string]bool, len(origins))
	for _, origin := range origins {
		allowed[strings.TrimRight(origin, "/")] = true
	}
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodGet || c.Request.Method == http.MethodHead || c.Request.Method == http.MethodOptions {
			c.Next()
			return
		}
		origin := strings.TrimRight(c.GetHeader("Origin"), "/")
		if origin == "" || !allowed[origin] {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"success": false, "message": "Request origin is not allowed."})
			return
		}
		c.Next()
	}
}

func SetCookie(c *gin.Context, token string, secure bool) {
	http.SetCookie(c.Writer, &http.Cookie{Name: CookieName, Value: token, Path: "/recruit_api", HttpOnly: true, Secure: secure, SameSite: http.SameSiteLaxMode, MaxAge: 8 * 60 * 60})
}

func ClearCookie(c *gin.Context, secure bool) {
	http.SetCookie(c.Writer, &http.Cookie{Name: CookieName, Value: "", Path: "/recruit_api", HttpOnly: true, Secure: secure, SameSite: http.SameSiteLaxMode, MaxAge: -1})
}

func unauthorized(c *gin.Context) {
	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Please sign in to continue."})
}

func nullableInt(value *int) interface{} {
	if value == nil {
		return 0
	}
	return *value
}
