# app/serializers/layout_serializer.rb
class LayoutSerializer < ActiveModel::Serializer
  attributes :id, :name, :description, :plot_width, :plot_depth, :created_at, :updated_at # Add plot dimensions
  has_many :brackets
  has_many :beams
end