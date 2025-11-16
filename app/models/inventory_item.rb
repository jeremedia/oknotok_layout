class InventoryItem < ApplicationRecord
  has_many :layout_components, dependent: :nullify
  has_many :inventory_adjustments, dependent: :destroy

  enum :category, {
    bracket: "bracket",
    lumber_4x4: "lumber_4x4",
    lumber_6x6: "lumber_6x6"
  }, validate: true

  validates :name, presence: true
  validates :category, presence: true
  validates :on_hand, numericality: { greater_than_or_equal_to: 0 }
  validates :reserved, numericality: { greater_than_or_equal_to: 0 }
  validate :reserved_not_greater_than_on_hand

  def available_quantity
    on_hand - reserved
  end

  private

  def reserved_not_greater_than_on_hand
    return if reserved <= on_hand

    errors.add(:reserved, "cannot exceed on hand quantity")
  end
end
