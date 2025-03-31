class Layout < ApplicationRecord
  has_many :brackets, dependent: :destroy # If a layout is deleted, delete its brackets
  has_many :beams, dependent: :destroy    # If a layout is deleted, delete its beams

end
