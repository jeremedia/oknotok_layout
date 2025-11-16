require "test_helper"

module Admin
  class InventoryItemsControllerTest < ActionDispatch::IntegrationTest
    setup do
      sign_in members(:admin)
      @inventory_item = inventory_items(:steel_brackets)
    end

    test "admin updates inventory attributes" do
      patch admin_inventory_item_path(@inventory_item), params: { inventory_item: { on_hand: 45 } }

      assert_redirected_to admin_inventory_items_path
      assert_equal 45, @inventory_item.reload.on_hand
    end

    test "admin records inventory adjustment" do
      assert_difference -> { InventoryAdjustment.count }, 1 do
        post admin_inventory_item_adjustments_path(@inventory_item), params: { inventory_adjustment: { change: 5, reason: "Top off" } }
      end

      assert_redirected_to admin_inventory_items_path
      assert_equal 5, InventoryAdjustment.order(:created_at).last.change
    end
  end
end
