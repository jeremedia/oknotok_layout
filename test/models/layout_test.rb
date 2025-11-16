require "test_helper"

class LayoutTest < ActiveSupport::TestCase
  # Setup
  def setup
    @valid_layout = Layout.new(
      name: "Test Layout",
      description: "A test layout",
      plot_width: 100,
      plot_depth: 100
    )
  end

  # Valid layout tests
  test "should save valid layout" do
    assert @valid_layout.save, "Failed to save valid layout: #{@valid_layout.errors.full_messages}"
  end

  # Name validation tests
  test "should not save layout without name" do
    @valid_layout.name = nil
    assert_not @valid_layout.save, "Saved layout without name"
    assert_includes @valid_layout.errors[:name], "can't be blank"
  end

  test "should not save layout with empty name" do
    @valid_layout.name = ""
    assert_not @valid_layout.save, "Saved layout with empty name"
    assert_includes @valid_layout.errors[:name], "can't be blank"
  end

  test "should not save layout with name exceeding 255 characters" do
    @valid_layout.name = "a" * 256
    assert_not @valid_layout.save, "Saved layout with name too long"
    assert_includes @valid_layout.errors[:name], "is too long (maximum is 255 characters)"
  end

  # Plot width validation tests
  test "should not save layout without plot_width" do
    @valid_layout.plot_width = nil
    assert_not @valid_layout.save, "Saved layout without plot_width"
    assert_includes @valid_layout.errors[:plot_width], "can't be blank"
  end

  test "should not save layout with plot_width less than 50" do
    @valid_layout.plot_width = 40
    assert_not @valid_layout.save, "Saved layout with plot_width < 50"
    assert_includes @valid_layout.errors[:plot_width], "must be greater than or equal to 50"
  end

  test "should not save layout with plot_width not a multiple of 50" do
    @valid_layout.plot_width = 75
    assert_not @valid_layout.save, "Saved layout with plot_width not multiple of 50"
    assert_includes @valid_layout.errors[:plot_width], "must be a multiple of 50 feet"
  end

  test "should not save layout with plot_width exceeding 1000" do
    @valid_layout.plot_width = 1050
    assert_not @valid_layout.save, "Saved layout with plot_width > 1000"
    assert_includes @valid_layout.errors[:plot_width], "cannot exceed 1000 feet"
  end

  test "should not save layout with non-integer plot_width" do
    @valid_layout.plot_width = 100.5
    assert_not @valid_layout.save, "Saved layout with non-integer plot_width"
    assert_includes @valid_layout.errors[:plot_width], "must be an integer"
  end

  # Plot depth validation tests
  test "should not save layout without plot_depth" do
    @valid_layout.plot_depth = nil
    assert_not @valid_layout.save, "Saved layout without plot_depth"
    assert_includes @valid_layout.errors[:plot_depth], "can't be blank"
  end

  test "should not save layout with plot_depth less than 50" do
    @valid_layout.plot_depth = 40
    assert_not @valid_layout.save, "Saved layout with plot_depth < 50"
    assert_includes @valid_layout.errors[:plot_depth], "must be greater than or equal to 50"
  end

  test "should not save layout with plot_depth not a multiple of 50" do
    @valid_layout.plot_depth = 125
    assert_not @valid_layout.save, "Saved layout with plot_depth not multiple of 50"
    assert_includes @valid_layout.errors[:plot_depth], "must be a multiple of 50 feet"
  end

  test "should not save layout with plot_depth exceeding 1000" do
    @valid_layout.plot_depth = 1050
    assert_not @valid_layout.save, "Saved layout with plot_depth > 1000"
    assert_includes @valid_layout.errors[:plot_depth], "cannot exceed 1000 feet"
  end

  # Valid edge cases
  test "should save layout with minimum valid dimensions" do
    @valid_layout.plot_width = 50
    @valid_layout.plot_depth = 50
    assert @valid_layout.save, "Failed to save layout with minimum valid dimensions"
  end

  test "should save layout with maximum valid dimensions" do
    @valid_layout.plot_width = 1000
    @valid_layout.plot_depth = 1000
    assert @valid_layout.save, "Failed to save layout with maximum valid dimensions"
  end

  test "should save layout with valid 50-foot increments" do
    [50, 100, 150, 200, 250, 500].each do |dimension|
      layout = Layout.new(
        name: "Test Layout #{dimension}",
        plot_width: dimension,
        plot_depth: dimension
      )
      assert layout.save, "Failed to save layout with #{dimension}ft dimensions"
    end
  end

  # Association tests
  test "should have many brackets" do
    assert_respond_to @valid_layout, :brackets
  end

  test "should have many beams" do
    assert_respond_to @valid_layout, :beams
  end

  test "should destroy dependent brackets when layout is destroyed" do
    @valid_layout.save!
    bracket = @valid_layout.brackets.create!(x: 0, y: 8, z: 0)
    bracket_id = bracket.id

    assert_difference "Bracket.count", -1 do
      @valid_layout.destroy
    end

    assert_nil Bracket.find_by(id: bracket_id)
  end

  test "should destroy dependent beams when layout is destroyed" do
    @valid_layout.save!
    bracket1 = @valid_layout.brackets.create!(x: 0, y: 8, z: 0)
    bracket2 = @valid_layout.brackets.create!(x: 12, y: 8, z: 0)
    beam = @valid_layout.beams.create!(
      beam_type: "crossbeam",
      length: 12,
      start_bracket: bracket1,
      end_bracket: bracket2,
      start_socket: "+x",
      end_socket: "-x"
    )
    beam_id = beam.id

    assert_difference "Beam.count", -1 do
      @valid_layout.destroy
    end

    assert_nil Beam.find_by(id: beam_id)
  end
end
