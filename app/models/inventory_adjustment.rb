class InventoryAdjustment < ApplicationRecord
  belongs_to :inventory_item
  belongs_to :admin, class_name: "Member"

  validates :change, presence: true
  validates :reason, presence: true
  validates :applied_at, presence: true
end
