# test/controllers/api/v1/brackets_controller_test.rb
require "test_helper"

class Api::V1::BracketsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @layout = layouts(:one)
    @bracket = brackets(:one)
  end

  # ===== INDEX Tests =====
  test "should get brackets for layout" do
    get api_v1_layout_brackets_url(@layout), as: :json
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_kind_of Array, json_response
  end

  test "should return 404 for non-existent layout" do
    get api_v1_layout_brackets_url(layout_id: 99999), as: :json
    assert_response :not_found
  end

  # ===== SHOW Tests =====
  test "should show bracket" do
    get api_v1_bracket_url(@bracket), as: :json
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal @bracket.id, json_response["id"]
    assert_equal @bracket.x, json_response["x"]
    assert_equal @bracket.y, json_response["y"]
    assert_equal @bracket.z, json_response["z"]
  end

  test "should return 404 for non-existent bracket" do
    get api_v1_bracket_url(id: 99999), as: :json
    assert_response :not_found
  end

  # ===== CREATE Tests =====
  test "should create bracket with valid coordinates" do
    assert_difference("Bracket.count") do
      post api_v1_layout_brackets_url(@layout), params: {
        bracket: {
          x: 12.0,
          y: 8.0,
          z: 12.0
        }
      }, as: :json
    end
    assert_response :created
    json_response = JSON.parse(response.body)
    assert_equal 12.0, json_response["x"]
    assert_equal 8.0, json_response["y"]
  end

  test "should not create bracket with missing coordinates" do
    assert_no_difference("Bracket.count") do
      post api_v1_layout_brackets_url(@layout), params: {
        bracket: {
          x: 12.0,
          z: 12.0
          # Missing y
        }
      }, as: :json
    end
    assert_response :unprocessable_entity
  end

  test "should not create bracket with negative y coordinate" do
    assert_no_difference("Bracket.count") do
      post api_v1_layout_brackets_url(@layout), params: {
        bracket: {
          x: 12.0,
          y: -5.0,
          z: 12.0
        }
      }, as: :json
    end
    assert_response :unprocessable_entity
  end

  test "should not create bracket outside layout bounds" do
    layout = Layout.create!(name: "SmallLayout", plot_width: 50, plot_depth: 50)

    assert_no_difference("Bracket.count") do
      post api_v1_layout_brackets_url(layout), params: {
        bracket: {
          x: 100.0, # Outside bounds
          y: 8.0,
          z: 0.0
        }
      }, as: :json
    end
    assert_response :unprocessable_entity
  end

  test "should not create overlapping bracket" do
    layout = Layout.create!(name: "TestLayout", plot_width: 100, plot_depth: 100)
    existing = layout.brackets.create!(x: 0.0, y: 8.0, z: 0.0)

    assert_no_difference("Bracket.count") do
      post api_v1_layout_brackets_url(layout), params: {
        bracket: {
          x: 0.05, # Too close to existing bracket
          y: 8.0,
          z: 0.05
        }
      }, as: :json
    end
    assert_response :unprocessable_entity
    json_response = JSON.parse(response.body)
    assert json_response["errors"].any? { |e| e.include?("overlaps") }
  end

  # ===== UPDATE Tests =====
  test "should update bracket coordinates" do
    patch api_v1_bracket_url(@bracket), params: {
      bracket: {
        x: 24.0
      }
    }, as: :json
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal 24.0, json_response["x"]
  end

  test "should not update bracket with invalid coordinates" do
    patch api_v1_bracket_url(@bracket), params: {
      bracket: {
        y: -10.0 # Negative y
      }
    }, as: :json
    assert_response :unprocessable_entity
  end

  # ===== DESTROY Tests =====
  test "should destroy bracket and associated beams" do
    layout = Layout.create!(name: "TestLayout", plot_width: 100, plot_depth: 100)
    bracket = layout.brackets.create!(x: 0, y: 8, z: 0)
    beam = layout.beams.create!(
      beam_type: "upright",
      length: 8,
      start_bracket: bracket,
      start_socket: "-y"
    )

    assert_difference(["Bracket.count", "Beam.count"], -1) do
      delete api_v1_bracket_url(bracket), as: :json
    end
    assert_response :no_content
  end

  test "should return 404 when destroying non-existent bracket" do
    delete api_v1_bracket_url(id: 99999), as: :json
    assert_response :not_found
  end
end
