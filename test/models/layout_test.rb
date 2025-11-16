require "test_helper"

class LayoutTest < ActiveSupport::TestCase
  setup do
    @layout = layouts(:real_inventory_layout)
    @steel_brackets = inventory_items(:steel_brackets)
  end

  test "real inventory layouts cannot reserve more components than available" do
    @layout.layout_components.build(
      component_type: "steel_bracket",
      variant: "BRKT-STD",
      quantity: @steel_brackets.on_hand + 1,
      position_data: {},
      inventory_item: @steel_brackets
    )

    assert_not @layout.valid?, "expected layout to be invalid when allocating more steel brackets than available"
    assert @layout.errors[:base].any?, "expected validation errors on base explaining inventory shortage"
  end

  test "reservation service populates snapshot and inventory counts" do
    layout = layouts(:real_inventory_layout)
    service = InventoryReservationService.new(layout)

    result = service.reserve!

    assert result.success?
    layout.reload
    assert_equal 10, layout.reserved_inventory_snapshot[inventory_items(:steel_brackets).id.to_s]
    assert_equal 20, layout.reserved_inventory_snapshot[inventory_items(:lumber_4x4).id.to_s]
    assert_equal 10, inventory_items(:steel_brackets).reload.reserved
  end

  test "saving real inventory layout automatically reserves inventory" do
    designer = members(:designer)
    bracket = inventory_items(:steel_brackets)
    lumber = inventory_items(:lumber_4x4)

    layout = Layout.new(
      name: "Auto Reserve Example",
      mode: :real_inventory,
      status: :draft,
      owner: designer,
      last_saved_by: designer,
      plot_width: 100,
      plot_depth: 100
    )

    layout.layout_components.build(
      component_type: :steel_bracket,
      variant: "BRKT-STD",
      quantity: 5,
      position_data: {},
      inventory_item: bracket
    )

    layout.layout_components.build(
      component_type: :beam_4x4,
      variant: "LMB-4X4-8",
      quantity: 10,
      position_data: {},
      inventory_item: lumber
    )

    assert_difference -> { bracket.reload.reserved }, 5 do
      assert_difference -> { lumber.reload.reserved }, 10 do
        assert layout.save, "expected layout to save successfully"
      end
    end

    snapshot = layout.reload.reserved_inventory_snapshot
    assert_equal 5, snapshot[bracket.id.to_s], "expected snapshot to capture bracket reservation"
    assert_equal 10, snapshot[lumber.id.to_s], "expected snapshot to capture lumber reservation"
  end

  test "destroying real inventory layout releases reserved inventory" do
    layout = layouts(:auto_reserve_layout).dup
    layout.assign_attributes(name: "Destroy Release Example")
    layout.save!(validate: false)
    layouts(:auto_reserve_layout).layout_components.each do |component|
      layout.layout_components.create!(
        component_type: component.component_type,
        variant: component.variant,
        quantity: component.quantity,
        position_data: component.position_data,
        inventory_item: component.inventory_item
      )
    end

    InventoryReservationService.new(layout).reserve!
    bracket = inventory_items(:steel_brackets)

    assert_difference -> { bracket.reload.reserved }, -5 do
      assert_difference -> { Layout.count }, -1 do
        layout.destroy
      end
    end
  end
end
