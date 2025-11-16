require "application_system_test_case"

class LayoutUnlimitedModeTest < ApplicationSystemTestCase
  test "unlimited layouts display conceptual messaging" do
    layout = layouts(:concept_review_layout)

    sign_in_as members(:designer)
    visit layouts_url

    assert_text layout.name
    card = find("article", text: layout.name)
    within(card) do
      assert_text "Concept Mode"
      assert_text "Conceptual layout (does not consume inventory)"
      assert_no_text "Reserved Inventory Snapshot"
    end

    page.save_screenshot Rails.root.join("specs/001-the-goal-of/previews/unlimited-mode.png").to_s
  end
end
