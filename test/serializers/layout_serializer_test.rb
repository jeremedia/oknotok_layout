require "test_helper"

class LayoutSerializerTest < ActiveSupport::TestCase
  test "includes remaining inventory snapshot for real inventory layouts" do
    layout = layouts(:real_inventory_layout)
    InventoryReservationService.new(layout).reserve!
    layout.reload

    payload = LayoutSerializer.new(layout).as_json

    snapshot = payload.fetch(:reserved_inventory_snapshot)
    bracket_id = inventory_items(:steel_brackets).id.to_s
    lumber_id = inventory_items(:lumber_4x4).id.to_s

    assert_equal 10, snapshot.fetch(bracket_id)
    assert_equal 20, snapshot.fetch(lumber_id)
  end

  test "marks layouts in unlimited mode as conceptual" do
    layout = layouts(:unlimited_layout)

    payload = LayoutSerializer.new(layout).as_json

    assert_equal true, payload[:conceptual]
  end

  test "exposes remaining inventory details for each tracked item" do
    layout = layouts(:auto_reserve_layout)
    service = InventoryReservationService.new(layout)
    service.reserve!
    layout.reload

    payload = LayoutSerializer.new(layout).as_json
    bracket_id = inventory_items(:steel_brackets).id.to_s
    lumber_id = inventory_items(:lumber_4x4).id.to_s

    steel = payload.fetch(:remaining_inventory).fetch(bracket_id)
    lumber = payload.fetch(:remaining_inventory).fetch(lumber_id)

    assert_equal({ "on_hand" => 40, "reserved" => 5, "available" => 35, "required" => 5 }, steel)
    assert_equal({ "on_hand" => 60, "reserved" => 10, "available" => 50, "required" => 10 }, lumber)
  end
end
