package middleware

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"campus-sentinel/backend/internal/database"
	"campus-sentinel/backend/internal/model"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var JWTSecret = []byte("campus-sentinel-secret-key-2026-secure")

type JWTClaims struct {
	UserID    uint       `json:"user_id"`
	Email     string     `json:"email"`
	Role      model.Role `json:"role"`
	FirstName string     `json:"first_name"`
	LastName  string     `json:"last_name"`
	jwt.RegisteredClaims
}

// GenerateJWT creates a new JWT for an authenticated user.
func GenerateJWT(user model.User) (string, error) {
	claims := JWTClaims{
		UserID:    user.ID,
		Email:     user.Email,
		Role:      user.Role,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "campus-sentinel",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(JWTSecret)
}

// AuthMiddleware validates JWT in the Authorization header.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims := &JWTClaims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return JWTSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired authorization token"})
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("userEmail", claims.Email)
		c.Set("userRole", claims.Role)
		c.Set("userName", fmt.Sprintf("%s %s", claims.FirstName, claims.LastName))

		c.Next()
	}
}

// RequireRole enforces Role-Based Access Control (RBAC).
func RequireRole(allowedRoles ...model.Role) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("userRole")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: No role assigned"})
			c.Abort()
			return
		}

		currentRole := roleVal.(model.Role)

		// Super admin always has bypass authorization
		if currentRole == model.RoleSuperAdmin {
			c.Next()
			return
		}

		for _, role := range allowedRoles {
			if currentRole == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{
			"error": fmt.Sprintf("Access forbidden for role '%s'. Allowed roles: %v", currentRole, allowedRoles),
		})
		c.Abort()
	}
}

// LogAuditAction registers an entry in the audit trail.
func LogAuditAction(c *gin.Context, actionType, targetResource string, targetID *uint, metadata string) {
	var actorID *uint
	actorEmail := "anonymous"
	actorRole := "PUBLIC"

	if idVal, exists := c.Get("userID"); exists {
		id := idVal.(uint)
		actorID = &id
	}
	if emailVal, exists := c.Get("userEmail"); exists {
		actorEmail = emailVal.(string)
	}
	if roleVal, exists := c.Get("userRole"); exists {
		actorRole = string(roleVal.(model.Role))
	}

	audit := model.AuditLog{
		ActorID:        actorID,
		ActorEmail:     actorEmail,
		ActorRole:      actorRole,
		ActionType:     actionType,
		TargetResource: targetResource,
		TargetID:       targetID,
		IPAddress:      c.ClientIP(),
		UserAgent:      c.Request.UserAgent(),
		Metadata:       metadata,
		CreatedAt:      time.Now(),
	}

	database.DB.Create(&audit)
}
