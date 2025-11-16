module Admin
  class InventoryItemsController < BaseController
    before_action :set_inventory_item, only: %i[update]

    def index
      @inventory_items = InventoryItem.includes(:inventory_adjustments).order(:name)
    end

    def update
      if @inventory_item.update(inventory_item_params)
        redirect_to admin_inventory_items_path, notice: "Inventory updated"
      else
        redirect_to admin_inventory_items_path, alert: @inventory_item.errors.full_messages.to_sentence
      end
    end

    private

    def set_inventory_item
      @inventory_item = InventoryItem.find(params[:id])
    end

    def inventory_item_params
      params.require(:inventory_item).permit(:name, :on_hand, :reserved, :active, :notes)
    end
  end
end
