module Admin
  class MembersController < BaseController
    def index
      @members = Member.order(:email)
      @invitation = Member.new
    end

    def update
      member = Member.find(params[:id])
      if member.update(member_params)
        redirect_to admin_members_path, notice: "Member updated"
      else
        redirect_to admin_members_path, alert: member.errors.full_messages.to_sentence
      end
    end

    private

    def member_params
      params.require(:member).permit(:status, :role)
    end
  end
end
