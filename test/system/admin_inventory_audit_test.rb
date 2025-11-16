require "application_system_test_case"

class AdminInventoryAuditTest < ApplicationSystemTestCase
  test "admin invites member and records inventory adjustment" do
    sign_in_as members(:admin)
    visit admin_inventory_items_url

    assert_text "Inventory Dashboard"

    click_on "Invite Member"
    fill_in "Email", with: "sleepy@example.com"
    fill_in "Name", with: "Sleepy Camper"
    click_on "Send Invitation"

    assert_text "Invitation sent"

    click_on "Inventory"
    within("article", text: "Standard Steel Bracket") do
      fill_in "Change", with: "5"
      fill_in "Reason", with: "Donation"
      click_on "Record Adjustment"
    end

    assert_text "Adjustment saved"

    page.save_screenshot Rails.root.join("specs/001-the-goal-of/previews/admin-inventory.png").to_s
  end
end
