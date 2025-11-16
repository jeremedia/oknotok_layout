module Admin
  class InvitationsController < BaseController
    def create
      member = Member.invite!(current_member, invitation_params)
      Admin::InvitationMailer.with(member: member).invite.deliver_now
      redirect_to admin_members_path, notice: "Invitation sent"
    rescue ActiveRecord::RecordInvalid => e
      redirect_to admin_members_path, alert: e.record.errors.full_messages.to_sentence
    end

    private

    def invitation_params
      params.require(:member).permit(:email, :name)
    end
  end
end
