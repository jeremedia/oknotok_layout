# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

password = ENV.fetch("SEED_MEMBER_PASSWORD", "password123")

admin = Member.find_or_create_by!(email: "admin@example.com") do |member|
  member.name = "Camp Admin"
  member.role = :admin
  member.status = :active
  member.password = password
  member.password_confirmation = password
end

if admin.encrypted_password.blank?
  admin.update!(password: password, password_confirmation: password)
end

[
  { name: "Standard Steel Bracket", category: :bracket, on_hand: 40 },
  { name: "4x4 Lumber (8ft)", category: :lumber_4x4, on_hand: 60 },
  { name: "6x6 Lumber (12ft)", category: :lumber_6x6, on_hand: 24 }
].each do |attrs|
  InventoryItem.find_or_create_by!(name: attrs[:name], category: attrs[:category]) do |item|
    item.on_hand = attrs[:on_hand]
  end
end


designer = Member.find_or_create_by!(email: "designer@example.com") do |member|
  member.name = "Designer One"
  member.role = :member
  member.status = :active
  member.invited_by = admin
  member.password = password
  member.password_confirmation = password
end

if designer.encrypted_password.blank?
  designer.update!(password: password, password_confirmation: password)
end
