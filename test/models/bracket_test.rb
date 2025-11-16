require "test_helper"

class BracketTest < ActiveSupport::TestCase
  # Setup
  def setup
    @layout = Layout.create!(
      name: "Test Layout",
      plot_width: 100,
      plot_depth: 100
    )
    @valid_bracket = Bracket.new(
      layout: @layout,
      x: 0,
      y: 8,
      z: 0
    )
  end

  # Valid bracket tests
  test "should save valid bracket" do
    assert @valid_bracket.save, "Failed to save valid bracket: #{@valid_bracket.errors.full_messages}"
  end

  # Coordinate validation tests
  test "should not save bracket without x coordinate" do
    @valid_bracket.x = nil
    assert_not @valid_bracket.save, "Saved bracket without x coordinate"
    assert_includes @valid_bracket.errors[:x], "can't be blank"
  end

  test "should not save bracket without y coordinate" do
    @valid_bracket.y = nil
    assert_not @valid_bracket.save, "Saved bracket without y coordinate"
    assert_includes @valid_bracket.errors[:y], "can't be blank"
  end

  test "should not save bracket without z coordinate" do
    @valid_bracket.z = nil
    assert_not @valid_bracket.save, "Saved bracket without z coordinate"
    assert_includes @valid_bracket.errors[:z], "can't be blank"
  end

  test "should not save bracket with negative y coordinate" do
    @valid_bracket.y = -1
    assert_not @valid_bracket.save, "Saved bracket with negative y coordinate"
    assert_includes @valid_bracket.errors[:y], "must be greater than or equal to 0"
  end

  test "should save bracket with y = 0" do
    @valid_bracket.y = 0
    assert @valid_bracket.save, "Failed to save bracket with y = 0"
  end

  test "should not save bracket with non-numeric x" do
    @valid_bracket.x = "not a number"
    assert_not @valid_bracket.save, "Saved bracket with non-numeric x"
    assert_includes @valid_bracket.errors[:x], "is not a number"
  end

  # Layout association tests
  test "should not save bracket without layout" do
    @valid_bracket.layout = nil
    assert_not @valid_bracket.save, "Saved bracket without layout"
    assert_includes @valid_bracket.errors[:layout], "can't be blank"
  end

  test "should belong to layout" do
    @valid_bracket.save!
    assert_equal @layout, @valid_bracket.layout
  end

  # Bounds checking tests
  test "should not save bracket outside layout bounds - positive x" do
    @valid_bracket.x = 51 # Layout width is 100, so half is 50
    assert_not @valid_bracket.save, "Saved bracket outside positive x bound"
    assert_includes @valid_bracket.errors[:x], "must be within layout bounds"
  end

  test "should not save bracket outside layout bounds - negative x" do
    @valid_bracket.x = -51
    assert_not @valid_bracket.save, "Saved bracket outside negative x bound"
    assert_includes @valid_bracket.errors[:x], "must be within layout bounds"
  end

  test "should not save bracket outside layout bounds - positive z" do
    @valid_bracket.z = 51 # Layout depth is 100, so half is 50
    assert_not @valid_bracket.save, "Saved bracket outside positive z bound"
    assert_includes @valid_bracket.errors[:z], "must be within layout bounds"
  end

  test "should not save bracket outside layout bounds - negative z" do
    @valid_bracket.z = -51
    assert_not @valid_bracket.save, "Saved bracket outside negative z bound"
    assert_includes @valid_bracket.errors[:z], "must be within layout bounds"
  end

  test "should save bracket at layout boundary" do
    @valid_bracket.x = 50 # Exactly at boundary
    @valid_bracket.z = 50
    assert @valid_bracket.save, "Failed to save bracket at layout boundary"
  end

  test "should save bracket at origin" do
    @valid_bracket.x = 0
    @valid_bracket.z = 0
    assert @valid_bracket.save, "Failed to save bracket at origin"
  end

  # Overlap validation tests
  test "should not save bracket overlapping with existing bracket" do
    @valid_bracket.save!

    overlapping_bracket = Bracket.new(
      layout: @layout,
      x: 0.5, # Within 1 foot of existing bracket at (0, 8, 0)
      y: 8,
      z: 0
    )

    assert_not overlapping_bracket.save, "Saved overlapping bracket"
    assert_includes overlapping_bracket.errors[:base], "A bracket already exists at this position"
  end

  test "should save bracket more than 1 foot away from existing bracket" do
    @valid_bracket.save!

    distant_bracket = Bracket.new(
      layout: @layout,
      x: 2, # More than 1 foot away
      y: 8,
      z: 0
    )

    assert distant_bracket.save, "Failed to save bracket more than 1 foot away"
  end

  test "should allow updating existing bracket without overlap error" do
    @valid_bracket.save!
    @valid_bracket.y = 10 # Change y coordinate

    assert @valid_bracket.save, "Failed to update existing bracket"
  end

  # Association tests
  test "should have many started_beams" do
    assert_respond_to @valid_bracket, :started_beams
  end

  test "should have many ended_beams" do
    assert_respond_to @valid_bracket, :ended_beams
  end

  test "should destroy dependent started_beams when bracket is destroyed" do
    @valid_bracket.save!
    beam = @valid_bracket.started_beams.create!(
      layout: @layout,
      beam_type: "upright",
      length: 8,
      start_socket: "-y"
    )
    beam_id = beam.id

    assert_difference "Beam.count", -1 do
      @valid_bracket.destroy
    end

    assert_nil Beam.find_by(id: beam_id)
  end

  test "should destroy dependent ended_beams when bracket is destroyed" do
    @valid_bracket.save!
    bracket2 = @layout.brackets.create!(x: 12, y: 8, z: 0)

    beam = bracket2.ended_beams.create!(
      layout: @layout,
      beam_type: "crossbeam",
      length: 12,
      start_bracket: @valid_bracket,
      end_bracket: bracket2,
      start_socket: "+x",
      end_socket: "-x"
    )
    beam_id = beam.id

    assert_difference "Beam.count", -1 do
      bracket2.destroy
    end

    assert_nil Beam.find_by(id: beam_id)
  end

  # Edge cases
  test "should handle floating point coordinates" do
    @valid_bracket.x = 12.5
    @valid_bracket.z = -7.3
    assert @valid_bracket.save, "Failed to save bracket with floating point coordinates"
  end

  test "should work with different layout sizes" do
    large_layout = Layout.create!(
      name: "Large Layout",
      plot_width: 500,
      plot_depth: 500
    )

    bracket = Bracket.new(
      layout: large_layout,
      x: 200,
      y: 8,
      z: -150
    )

    assert bracket.save, "Failed to save bracket in larger layout"
  end
end
