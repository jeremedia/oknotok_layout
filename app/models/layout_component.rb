class LayoutComponent < ApplicationRecord
  belongs_to :layout
  belongs_to :inventory_item, optional: true

  enum :component_type, {
    steel_bracket: "steel_bracket",
    beam_4x4: "beam_4x4",
    beam_6x6: "beam_6x6"
  }, validate: true

  validates :component_type, presence: true
  validates :variant, presence: true
  validates :quantity, numericality: { greater_than_or_equal_to: 1 }
  validate :inventory_item_required_for_real_inventory

  after_commit :sync_layout_inventory, on: %i[create update]
  after_destroy_commit :sync_layout_inventory

  private

  def inventory_item_required_for_real_inventory
    return unless layout&.real_inventory?
    return if inventory_item.present?

    errors.add(:inventory_item, "must be present when layout consumes real inventory")
  end

  def sync_layout_inventory
    return unless layout&.persisted?
    return if layout.destroyed?

    InventoryReservationService.new(layout).sync!
  end
end
