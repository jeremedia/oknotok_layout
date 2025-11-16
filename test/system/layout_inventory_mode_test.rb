require "application_system_test_case"

class LayoutInventoryModeTest < ApplicationSystemTestCase
  test "designer sees remaining inventory while planning" do
    layout = layouts(:auto_reserve_layout)
    InventoryReservationService.new(layout).reserve!

    sign_in_as members(:designer)
    visit layouts_url

    assert_selector "h1", text: "Layouts"
    assert_text "Remaining Inventory"
    inventory_section = find("section", text: "Remaining Inventory", match: :first)
    within(inventory_section) do
      assert_text "Standard Steel Bracket"
      assert_text "Available: 35"
      assert_text "Reserved: 5"
    end

    page.save_screenshot Rails.root.join("specs/001-the-goal-of/previews/real-inventory.png").to_s
  end
end
