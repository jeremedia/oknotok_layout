require "test_helper"

class BeamTest < ActiveSupport::TestCase
  # Setup
  def setup
    @layout = Layout.create!(
      name: "Test Layout",
      plot_width: 100,
      plot_depth: 100
    )
    @bracket1 = @layout.brackets.create!(x: 0, y: 8, z: 0)
    @bracket2 = @layout.brackets.create!(x: 12, y: 8, z: 0)

    @valid_upright = Beam.new(
      layout: @layout,
      beam_type: "upright",
      length: 8,
      start_bracket: @bracket1,
      start_socket: "-y"
    )

    @valid_crossbeam = Beam.new(
      layout: @layout,
      beam_type: "crossbeam",
      length: 12,
      start_bracket: @bracket1,
      end_bracket: @bracket2,
      start_socket: "+x",
      end_socket: "-x"
    )
  end

  # Valid beam tests
  test "should save valid upright beam" do
    assert @valid_upright.save, "Failed to save valid upright: #{@valid_upright.errors.full_messages}"
  end

  test "should save valid crossbeam" do
    assert @valid_crossbeam.save, "Failed to save valid crossbeam: #{@valid_crossbeam.errors.full_messages}"
  end

  # Basic validation tests
  test "should not save beam without beam_type" do
    @valid_upright.beam_type = nil
    assert_not @valid_upright.save, "Saved beam without beam_type"
    assert_includes @valid_upright.errors[:beam_type], "can't be blank"
  end

  test "should not save beam with invalid beam_type" do
    @valid_upright.beam_type = "invalid"
    assert_not @valid_upright.save, "Saved beam with invalid beam_type"
    assert_includes @valid_upright.errors[:beam_type], "is not included in the list"
  end

  test "should not save beam without length" do
    @valid_upright.length = nil
    assert_not @valid_upright.save, "Saved beam without length"
    assert_includes @valid_upright.errors[:length], "can't be blank"
  end

  test "should not save beam with invalid length" do
    @valid_upright.length = 10
    assert_not @valid_upright.save, "Saved beam with invalid length"
    assert_includes @valid_upright.errors[:length], "is not included in the list"
  end

  test "should not save beam without start_socket" do
    @valid_upright.start_socket = nil
    assert_not @valid_upright.save, "Saved beam without start_socket"
    assert_includes @valid_upright.errors[:start_socket], "can't be blank"
  end

  test "should not save beam with invalid start_socket" do
    @valid_upright.start_socket = "invalid"
    assert_not @valid_upright.save, "Saved beam with invalid start_socket"
    assert_includes @valid_upright.errors[:start_socket], "is not included in the list"
  end

  test "should not save beam with invalid end_socket" do
    @valid_crossbeam.end_socket = "invalid"
    assert_not @valid_crossbeam.save, "Saved beam with invalid end_socket"
    assert_includes @valid_crossbeam.errors[:end_socket], "is not included in the list"
  end

  test "should not save beam without layout" do
    @valid_upright.layout = nil
    assert_not @valid_upright.save, "Saved beam without layout"
    assert_includes @valid_upright.errors[:layout], "can't be blank"
  end

  test "should not save beam without start_bracket" do
    @valid_upright.start_bracket = nil
    assert_not @valid_upright.save, "Saved beam without start_bracket"
    assert_includes @valid_upright.errors[:start_bracket], "can't be blank"
  end

  # Upright beam validation tests
  test "upright should not have end_bracket" do
    @valid_upright.end_bracket = @bracket2
    assert_not @valid_upright.save, "Saved upright with end_bracket"
    assert_includes @valid_upright.errors[:end_bracket], "must be nil for upright beams"
  end

  test "upright should not have end_socket" do
    @valid_upright.end_socket = "+y"
    assert_not @valid_upright.save, "Saved upright with end_socket"
    assert_includes @valid_upright.errors[:end_socket], "must be nil for upright beams"
  end

  test "upright should have length of 8" do
    @valid_upright.length = 12
    assert_not @valid_upright.save, "Saved upright with length != 8"
    assert_includes @valid_upright.errors[:length], "must be 8 feet for upright beams"
  end

  test "upright should have start_socket of -y" do
    @valid_upright.start_socket = "+x"
    assert_not @valid_upright.save, "Saved upright with start_socket != -y"
    assert_includes @valid_upright.errors[:start_socket], "must be '-y' (bottom socket) for upright beams"
  end

  test "upright bracket Y position should match beam length" do
    @bracket1.update!(y: 10) # Should be 8 for an 8ft upright
    assert_not @valid_upright.save, "Saved upright with mismatched bracket Y position"
    assert_includes @valid_upright.errors[:base], "should match bracket Y position"
  end

  test "upright should allow bracket Y within tolerance" do
    @bracket1.update!(y: 8.3) # Within 0.5 tolerance
    assert @valid_upright.save, "Failed to save upright with Y within tolerance"
  end

  # Crossbeam validation tests
  test "crossbeam should have end_bracket" do
    @valid_crossbeam.end_bracket = nil
    assert_not @valid_crossbeam.save, "Saved crossbeam without end_bracket"
    assert_includes @valid_crossbeam.errors[:end_bracket], "must be present for crossbeam beams"
  end

  test "crossbeam should have end_socket" do
    @valid_crossbeam.end_socket = nil
    assert_not @valid_crossbeam.save, "Saved crossbeam without end_socket"
    assert_includes @valid_crossbeam.errors[:end_socket], "must be present for crossbeam beams"
  end

  test "crossbeam should have length of 12" do
    @valid_crossbeam.length = 8
    assert_not @valid_crossbeam.save, "Saved crossbeam with length != 12"
    assert_includes @valid_crossbeam.errors[:length], "must be 12 feet for crossbeam beams"
  end

  # Bracket layout validation tests
  test "should not save beam with brackets from different layouts" do
    other_layout = Layout.create!(
      name: "Other Layout",
      plot_width: 100,
      plot_depth: 100
    )
    other_bracket = other_layout.brackets.create!(x: 12, y: 8, z: 0)

    @valid_crossbeam.end_bracket = other_bracket
    assert_not @valid_crossbeam.save, "Saved beam with brackets from different layouts"
    assert_includes @valid_crossbeam.errors[:end_bracket], "must belong to the same layout"
  end

  # Socket availability tests
  test "should not save beam with occupied start_socket" do
    # Create first beam using the +x socket
    first_beam = @layout.beams.create!(
      beam_type: "crossbeam",
      length: 12,
      start_bracket: @bracket1,
      end_bracket: @bracket2,
      start_socket: "+x",
      end_socket: "-x"
    )

    # Try to create second beam using the same +x socket
    second_beam = Beam.new(
      layout: @layout,
      beam_type: "crossbeam",
      length: 12,
      start_bracket: @bracket1,
      end_bracket: @bracket2,
      start_socket: "+x", # Same socket as first beam
      end_socket: "+z"
    )

    assert_not second_beam.save, "Saved beam with occupied start_socket"
    assert_includes second_beam.errors[:start_socket], "is already occupied"
  end

  test "should not save beam with occupied end_socket" do
    bracket3 = @layout.brackets.create!(x: 0, y: 8, z: 12)

    # Create first beam
    first_beam = @layout.beams.create!(
      beam_type: "crossbeam",
      length: 12,
      start_bracket: @bracket1,
      end_bracket: @bracket2,
      start_socket: "+x",
      end_socket: "-x"
    )

    # Try to create second beam using the same end socket
    second_beam = Beam.new(
      layout: @layout,
      beam_type: "crossbeam",
      length: 12,
      start_bracket: @bracket2,
      end_bracket: bracket3,
      start_socket: "-x", # This socket is already used by first_beam as end_socket
      end_socket: "+z"
    )

    assert_not second_beam.save, "Saved beam with occupied end_socket"
    assert_includes second_beam.errors[:start_socket], "is already occupied"
  end

  test "should allow different sockets on same bracket" do
    # First beam uses +x socket
    first_beam = @layout.beams.create!(
      beam_type: "crossbeam",
      length: 12,
      start_bracket: @bracket1,
      end_bracket: @bracket2,
      start_socket: "+x",
      end_socket: "-x"
    )

    bracket3 = @layout.brackets.create!(x: 0, y: 8, z: 12)

    # Second beam uses +z socket (different from +x)
    second_beam = Beam.new(
      layout: @layout,
      beam_type: "crossbeam",
      length: 12,
      start_bracket: @bracket1,
      end_bracket: bracket3,
      start_socket: "+z", # Different socket
      end_socket: "-z"
    )

    assert second_beam.save, "Failed to save beam with different socket on same bracket"
  end

  test "should allow updating existing beam without socket conflict" do
    @valid_crossbeam.save!
    @valid_crossbeam.has_side_panel = true # Change non-socket attribute

    assert @valid_crossbeam.save, "Failed to update existing beam"
  end

  # Valid socket names test
  test "should accept all valid socket names" do
    valid_sockets = %w[+x -x +y -y +z -z]

    valid_sockets.each do |socket|
      beam = Beam.new(
        layout: @layout,
        beam_type: "upright",
        length: 8,
        start_bracket: @layout.brackets.create!(x: socket.hash % 10, y: 8, z: socket.hash % 5),
        start_socket: "-y" # Uprights always use -y
      )
      assert beam.save, "Failed to save beam with valid configuration for socket #{socket}"
    end
  end

  # Association tests
  test "should belong to layout" do
    @valid_upright.save!
    assert_equal @layout, @valid_upright.layout
  end

  test "should belong to start_bracket" do
    @valid_upright.save!
    assert_equal @bracket1, @valid_upright.start_bracket
  end

  test "should belong to end_bracket for crossbeam" do
    @valid_crossbeam.save!
    assert_equal @bracket2, @valid_crossbeam.end_bracket
  end

  # Edge cases
  test "should handle has_side_panel flag" do
    @valid_crossbeam.has_side_panel = true
    assert @valid_crossbeam.save, "Failed to save beam with has_side_panel"
  end

  test "should default has_side_panel to false" do
    @valid_upright.save!
    assert_equal false, @valid_upright.has_side_panel
  end

  # Constants tests
  test "should have valid beam types constant" do
    assert_equal %w[upright crossbeam], Beam::VALID_BEAM_TYPES
  end

  test "should have valid lengths constant" do
    assert_equal [8, 12], Beam::VALID_LENGTHS
  end

  test "should have valid socket names constant" do
    assert_equal %w[+x -x +y -y +z -z], Beam::VALID_SOCKET_NAMES
  end
end
