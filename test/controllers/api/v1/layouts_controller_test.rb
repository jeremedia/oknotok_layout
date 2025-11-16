require "test_helper"

class Api::V1::LayoutsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @designer = members(:designer)
    @steel_brackets = inventory_items(:steel_brackets)
    @lumber = inventory_items(:lumber_4x4)
    sign_in @designer
  end

  test "creates layout with real inventory reservations" do
    post api_v1_layouts_url, params: {
      layout: {
        name: "Sunrise Deck",
        mode: "real_inventory",
        summary_note: "Initial draft",
        layout_components_attributes: [
          {
            component_type: "steel_bracket",
            variant: "BRKT-STD",
            quantity: 5,
            position_data: {},
            inventory_item_id: @steel_brackets.id
          },
          {
            component_type: "beam_4x4",
            variant: "LMB-4X4-8",
            quantity: 10,
            position_data: {},
            inventory_item_id: @lumber.id
          }
        ]
      }
    }, as: :json

    assert_response :created
    payload = JSON.parse(response.body)
    assert_equal "Sunrise Deck", payload.fetch("name")
    snapshot = payload.fetch("reserved_inventory_snapshot")
    assert_equal 5, snapshot[@steel_brackets.id.to_s]
    assert_equal 10, snapshot[@lumber.id.to_s]
    assert_equal 5, @steel_brackets.reload.reserved
  end

  test "rejects layout when inventory is insufficient" do
    post api_v1_layouts_url, params: {
      layout: {
        name: "Impossible Stage",
        mode: "real_inventory",
        summary_note: "Too many parts",
        layout_components_attributes: [
          {
            component_type: "steel_bracket",
            variant: "BRKT-STD",
            quantity: @steel_brackets.on_hand + 100,
            position_data: {},
            inventory_item_id: @steel_brackets.id
          }
        ]
      }
    }, as: :json

    assert_response :unprocessable_entity
    body = JSON.parse(response.body)
    assert body.fetch("errors").any? { |error| error.match?(/not enough/i) }
  end
end
