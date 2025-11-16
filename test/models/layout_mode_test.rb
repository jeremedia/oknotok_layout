require "test_helper"

class LayoutModeTest < ActiveSupport::TestCase
  setup do
    @steel_brackets = inventory_items(:steel_brackets)
    @layout = layouts(:real_inventory_layout)
    InventoryReservationService.new(@layout).reserve!
  end

  test "switching to unlimited releases reserved inventory" do
    service = InventoryReservationService.new(@layout)
    result = service.switch_mode!("unlimited")

    assert result.success?
    assert_equal "unlimited", @layout.reload.mode
    assert_equal({}, @layout.reserved_inventory_snapshot)
    assert_equal 0, @steel_brackets.reload.reserved
  end

  test "switching back to real inventory enforces availability" do
    service = InventoryReservationService.new(@layout)
    service.switch_mode!("unlimited")
    @layout.reload

    result = InventoryReservationService.new(@layout).switch_mode!("real_inventory")

    assert result.success?
    assert_equal "real_inventory", @layout.reload.mode
    assert_equal 10, @layout.reserved_inventory_snapshot[@steel_brackets.id.to_s]
  end

  test "switching to real inventory fails when components exceed availability" do
    layout = layouts(:overcommitted_layout)
    InventoryReservationService.new(layout).switch_mode!("unlimited")
    layout.reload

    result = InventoryReservationService.new(layout).switch_mode!("real_inventory")

    assert_not result.success?
    assert_includes result.errors.first, "not enough"
    assert_equal "unlimited", layout.reload.mode
    assert_empty layout.reserved_inventory_snapshot
  end
end
