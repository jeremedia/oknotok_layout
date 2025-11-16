class ApplicationController < ActionController::Base
  # before_action :authenticate_member!, unless: :devise_controller?

  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Override current_member to use admin user (ID 1) when auth is disabled
  def current_member
    @current_member ||= Member.find_by(id: 1) || Member.first
  end
  helper_method :current_member
end
