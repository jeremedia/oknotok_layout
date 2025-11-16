module Admin
  module InventoryItems
    class AdjustmentsController < Admin::BaseController
      before_action :set_inventory_item

      def create
        adjustment = @inventory_item.inventory_adjustments.build(adjustment_params.merge(
                                                                   admin: current_member,
                                                                   applied_at: Time.current
                                                                 ))

        InventoryItem.transaction do
          adjustment.save!
          @inventory_item.update!(on_hand: @inventory_item.on_hand + adjustment.change)
        end

        redirect_to admin_inventory_items_path, notice: "Adjustment saved"
      rescue ActiveRecord::RecordInvalid => e
        redirect_to admin_inventory_items_path, alert: e.record.errors.full_messages.to_sentence
      end

      private

      def set_inventory_item
        @inventory_item = InventoryItem.find(params[:inventory_item_id])
      end

      def adjustment_params
        params.require(:inventory_adjustment).permit(:change, :reason)
      end
    end
  end
end
