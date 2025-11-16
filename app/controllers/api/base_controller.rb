# app/controllers/api/base_controller.rb
#
# Base controller for all API endpoints.
# Includes CSRF protection to prevent cross-site request forgery attacks.
#
# All API controllers should inherit from this class instead of ActionController::API
# to ensure CSRF tokens are verified for state-changing requests (POST, PATCH, PUT, DELETE).
#
class Api::BaseController < ActionController::API
  # Include CSRF protection (normally only in ActionController::Base)
  # This protects against unauthorized API requests from malicious sites
  include ActionController::RequestForgeryProtection

  # Verify CSRF token for all requests
  # The token is sent from JavaScript via the X-CSRF-Token header
  protect_from_forgery with: :exception

  # Note: The CSRF token is automatically included in requests by apiClient.js
  # which reads it from the <meta name="csrf-token"> tag in the HTML head.
end
