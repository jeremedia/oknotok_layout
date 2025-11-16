require "test_helper"

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  driven_by :selenium, using: :headless_chrome, screen_size: [ 1400, 1400 ]

  def sign_in_as(member, password: "password123")
    visit new_member_session_path
    fill_in "Email", with: member.email
    fill_in "Password", with: password
    click_button "Log in"
  end
end
