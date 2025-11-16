module Admin
  class BaseController < ApplicationController
    before_action :authenticate_member!
    before_action :ensure_admin!

    private

    def ensure_admin!
      return if current_member&.admin?

      redirect_to root_path, alert: "You are not authorized to access admin tools."
    end
  end
end
