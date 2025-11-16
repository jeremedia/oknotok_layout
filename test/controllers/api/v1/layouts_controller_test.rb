# test/controllers/api/v1/layouts_controller_test.rb
require "test_helper"

class Api::V1::LayoutsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @layout = layouts(:one)
  end

  # ===== INDEX Tests =====
  test "should get index" do
    get api_v1_layouts_url, as: :json
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_kind_of Array, json_response
  end

  # ===== SHOW Tests =====
  test "should show layout with associations" do
    get api_v1_layout_url(@layout), as: :json
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal @layout.id, json_response["id"]
    assert json_response.key?("brackets")
    assert json_response.key?("beams")
  end

  test "should return 404 for non-existent layout" do
    get api_v1_layout_url(id: 99999), as: :json
    assert_response :not_found
    json_response = JSON.parse(response.body)
    assert_equal "Layout not found", json_response["error"]
  end

  # ===== CREATE Tests =====
  test "should create layout with valid params" do
    assert_difference("Layout.count") do
      post api_v1_layouts_url, params: {
        layout: {
          name: "Test Layout",
          plot_width: 100,
          plot_depth: 100
        }
      }, as: :json
    end
    assert_response :created
    json_response = JSON.parse(response.body)
    assert_equal "Test Layout", json_response["name"]
    assert_equal 100, json_response["plot_width"]
  end

  test "should not create layout with invalid name" do
    assert_no_difference("Layout.count") do
      post api_v1_layouts_url, params: {
        layout: {
          name: "",
          plot_width: 100,
          plot_depth: 100
        }
      }, as: :json
    end
    assert_response :unprocessable_entity
    json_response = JSON.parse(response.body)
    assert json_response["errors"].any?
  end

  test "should not create layout with invalid plot dimensions" do
    assert_no_difference("Layout.count") do
      post api_v1_layouts_url, params: {
        layout: {
          name: "Test",
          plot_width: 25, # Too small
          plot_depth: 100
        }
      }, as: :json
    end
    assert_response :unprocessable_entity
    json_response = JSON.parse(response.body)
    assert json_response["errors"].any?
  end

  test "should not create layout with plot dimensions not multiples of 50" do
    assert_no_difference("Layout.count") do
      post api_v1_layouts_url, params: {
        layout: {
          name: "Test",
          plot_width: 75, # Not multiple of 50
          plot_depth: 100
        }
      }, as: :json
    end
    assert_response :unprocessable_entity
  end

  # ===== UPDATE Tests =====
  test "should update layout with valid params" do
    patch api_v1_layout_url(@layout), params: {
      layout: {
        name: "Updated Name",
        plot_width: 150
      }
    }, as: :json
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal "Updated Name", json_response["name"]
    assert_equal 150, json_response["plot_width"]
  end

  test "should not update layout with invalid params" do
    patch api_v1_layout_url(@layout), params: {
      layout: {
        name: ""
      }
    }, as: :json
    assert_response :unprocessable_entity
    json_response = JSON.parse(response.body)
    assert json_response["errors"].any?
  end

  # ===== DESTROY Tests =====
  test "should destroy layout and associated data" do
    layout_with_data = Layout.create!(
      name: "ToDelete",
      plot_width: 100,
      plot_depth: 100
    )
    bracket = layout_with_data.brackets.create!(x: 0, y: 8, z: 0)

    assert_difference(["Layout.count", "Bracket.count"], -1) do
      delete api_v1_layout_url(layout_with_data), as: :json
    end
    assert_response :no_content
  end

  # ===== CLEAR Tests =====
  test "should clear layout contents" do
    layout = Layout.create!(name: "ToClear", plot_width: 100, plot_depth: 100)
    bracket = layout.brackets.create!(x: 0, y: 8, z: 0)

    assert_equal 1, layout.brackets.count

    delete clear_api_v1_layout_url(layout), as: :json
    assert_response :no_content

    layout.reload
    assert_equal 0, layout.brackets.count
  end

  test "should handle errors during clear gracefully" do
    # Test with non-existent layout
    delete clear_api_v1_layout_url(id: 99999), as: :json
    assert_response :not_found
  end
end
