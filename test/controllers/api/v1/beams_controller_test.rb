# test/controllers/api/v1/beams_controller_test.rb
require "test_helper"

class Api::V1::BeamsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @layout = layouts(:one)
    @bracket1 = brackets(:one)
    @bracket2 = brackets(:two)
    @beam = beams(:one)
  end

  # ===== INDEX Tests =====
  test "should get beams for layout" do
    get api_v1_layout_beams_url(@layout), as: :json
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_kind_of Array, json_response
  end

  test "should return 404 for non-existent layout" do
    get api_v1_layout_beams_url(layout_id: 99999), as: :json
    assert_response :not_found
  end

  # ===== SHOW Tests =====
  test "should show beam" do
    get api_v1_beam_url(@beam), as: :json
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal @beam.id, json_response["id"]
    assert_equal @beam.beam_type, json_response["beam_type"]
  end

  test "should return 404 for non-existent beam" do
    get api_v1_beam_url(id: 99999), as: :json
    assert_response :not_found
  end

  # ===== CREATE Tests - Upright =====
  test "should create upright beam with valid params" do
    layout = Layout.create!(name: "TestLayout", plot_width: 100, plot_depth: 100)
    bracket = layout.brackets.create!(x: 0, y: 8, z: 0)

    assert_difference("Beam.count") do
      post api_v1_layout_beams_url(layout), params: {
        beam: {
          beam_type: "upright",
          length: 8,
          start_bracket_id: bracket.id,
          start_socket: "-y"
        }
      }, as: :json
    end
    assert_response :created
    json_response = JSON.parse(response.body)
    assert_equal "upright", json_response["beam_type"]
    assert_equal 8, json_response["length"]
  end

  test "should not create upright with invalid length" do
    layout = Layout.create!(name: "TestLayout", plot_width: 100, plot_depth: 100)
    bracket = layout.brackets.create!(x: 0, y: 8, z: 0)

    assert_no_difference("Beam.count") do
      post api_v1_layout_beams_url(layout), params: {
        beam: {
          beam_type: "upright",
          length: 10, # Invalid length (must be 8 or 12)
          start_bracket_id: bracket.id,
          start_socket: "-y"
        }
      }, as: :json
    end
    assert_response :unprocessable_entity
  end

  test "should not create upright with end bracket" do
    layout = Layout.create!(name: "TestLayout", plot_width: 100, plot_depth: 100)
    bracket1 = layout.brackets.create!(x: 0, y: 8, z: 0)
    bracket2 = layout.brackets.create!(x: 12, y: 8, z: 0)

    assert_no_difference("Beam.count") do
      post api_v1_layout_beams_url(layout), params: {
        beam: {
          beam_type: "upright",
          length: 8,
          start_bracket_id: bracket1.id,
          end_bracket_id: bracket2.id, # Uprights shouldn't have end bracket
          start_socket: "-y",
          end_socket: "-y"
        }
      }, as: :json
    end
    assert_response :unprocessable_entity
  end

  # ===== CREATE Tests - Crossbeam =====
  test "should create crossbeam with valid params" do
    layout = Layout.create!(name: "TestLayout", plot_width: 100, plot_depth: 100)
    bracket1 = layout.brackets.create!(x: 0, y: 8, z: 0)
    bracket2 = layout.brackets.create!(x: 12, y: 8, z: 0)

    assert_difference("Beam.count") do
      post api_v1_layout_beams_url(layout), params: {
        beam: {
          beam_type: "crossbeam",
          length: 12,
          start_bracket_id: bracket1.id,
          end_bracket_id: bracket2.id,
          start_socket: "+x",
          end_socket: "-x"
        }
      }, as: :json
    end
    assert_response :created
    json_response = JSON.parse(response.body)
    assert_equal "crossbeam", json_response["beam_type"]
  end

  test "should not create crossbeam without end bracket" do
    layout = Layout.create!(name: "TestLayout", plot_width: 100, plot_depth: 100)
    bracket = layout.brackets.create!(x: 0, y: 8, z: 0)

    assert_no_difference("Beam.count") do
      post api_v1_layout_beams_url(layout), params: {
        beam: {
          beam_type: "crossbeam",
          length: 12,
          start_bracket_id: bracket.id,
          start_socket: "+x"
          # Missing end_bracket_id
        }
      }, as: :json
    end
    assert_response :unprocessable_entity
  end

  test "should not create beam with occupied socket" do
    layout = Layout.create!(name: "TestLayout", plot_width: 100, plot_depth: 100)
    bracket1 = layout.brackets.create!(x: 0, y: 8, z: 0)
    bracket2 = layout.brackets.create!(x: 12, y: 8, z: 0)

    # Create first beam using +x socket
    layout.beams.create!(
      beam_type: "crossbeam",
      length: 12,
      start_bracket: bracket1,
      end_bracket: bracket2,
      start_socket: "+x",
      end_socket: "-x"
    )

    # Try to create another beam using same socket
    assert_no_difference("Beam.count") do
      post api_v1_layout_beams_url(layout), params: {
        beam: {
          beam_type: "crossbeam",
          length: 12,
          start_bracket_id: bracket1.id,
          end_bracket_id: bracket2.id,
          start_socket: "+x", # Already occupied
          end_socket: "-x"
        }
      }, as: :json
    end
    assert_response :unprocessable_entity
  end

  test "should not create beam across different layouts" do
    layout1 = Layout.create!(name: "Layout1", plot_width: 100, plot_depth: 100)
    layout2 = Layout.create!(name: "Layout2", plot_width: 100, plot_depth: 100)
    bracket1 = layout1.brackets.create!(x: 0, y: 8, z: 0)
    bracket2 = layout2.brackets.create!(x: 12, y: 8, z: 0)

    assert_no_difference("Beam.count") do
      post api_v1_layout_beams_url(layout1), params: {
        beam: {
          beam_type: "crossbeam",
          length: 12,
          start_bracket_id: bracket1.id,
          end_bracket_id: bracket2.id, # Different layout!
          start_socket: "+x",
          end_socket: "-x"
        }
      }, as: :json
    end
    assert_response :unprocessable_entity
  end

  # ===== UPDATE Tests =====
  test "should update beam flags" do
    patch api_v1_beam_url(@beam), params: {
      beam: {
        has_side_panel: true
      }
    }, as: :json
    assert_response :success
    json_response = JSON.parse(response.body)
    assert json_response["has_side_panel"]
  end

  test "should not update beam with invalid type" do
    patch api_v1_beam_url(@beam), params: {
      beam: {
        beam_type: "invalid_type"
      }
    }, as: :json
    assert_response :unprocessable_entity
  end

  # ===== DESTROY Tests =====
  test "should destroy beam" do
    layout = Layout.create!(name: "TestLayout", plot_width: 100, plot_depth: 100)
    bracket = layout.brackets.create!(x: 0, y: 8, z: 0)
    beam = layout.beams.create!(
      beam_type: "upright",
      length: 8,
      start_bracket: bracket,
      start_socket: "-y"
    )

    assert_difference("Beam.count", -1) do
      delete api_v1_beam_url(beam), as: :json
    end
    assert_response :no_content
  end

  test "should return 404 when destroying non-existent beam" do
    delete api_v1_beam_url(id: 99999), as: :json
    assert_response :not_found
  end
end
