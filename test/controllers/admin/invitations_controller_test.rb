require "test_helper"

module Admin
  class InvitationsControllerTest < ActionDispatch::IntegrationTest
    setup do
      ActionMailer::Base.deliveries.clear
      @admin = members(:admin)
      sign_in @admin
    end

    test "admin can invite a new member" do
      assert_difference -> { ActionMailer::Base.deliveries.size }, 1 do
        assert_difference -> { Member.count }, 1 do
          post admin_invitations_path, params: { member: { email: "newmember@example.com", name: "New Member" } }
        end
      end

      assert_redirected_to admin_members_path
      follow_redirect!
      assert_match "Invitation sent", response.body
    end

    test "admin can deactivate a member" do
      member = members(:designer)

      patch admin_member_path(member), params: { member: { status: :inactive } }

      assert_redirected_to admin_members_path
      assert_equal "inactive", member.reload.status
    end
  end
end
