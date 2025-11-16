module Admin
  class InvitationMailer < ApplicationMailer
    def invite
      @member = params[:member]
      mail(to: @member.email, subject: "You're invited to OKNOTOK Layouts")
    end
  end
end
