class Member < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable,
         :recoverable, :rememberable, :validatable
  belongs_to :invited_by, class_name: "Member", optional: true

  has_many :owned_layouts, class_name: "Layout", foreign_key: :owner_id, inverse_of: :owner, dependent: :nullify
  has_many :inventory_adjustments, foreign_key: :admin_id, inverse_of: :admin, dependent: :nullify
  has_many :invited_members, class_name: "Member", foreign_key: :invited_by_id, inverse_of: :invited_by, dependent: :nullify

  enum :role, { member: "member", admin: "admin" }, validate: true
  enum :status, { invited: "invited", active: "active", inactive: "inactive" }, validate: true

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true

  scope :admins, -> { where(role: :admin) }
  scope :active, -> { where(status: :active) }

  class << self
    def invite!(inviter, attributes)
      attrs = attributes.to_h.symbolize_keys
      password = Devise.friendly_token.first(20)

      create!(
        attrs.merge(
          status: :invited,
          role: attrs[:role] || :member,
          invited_by: inviter,
          password: password,
          password_confirmation: password
        )
      )
    end
  end

  def activate!
    update!(status: :active)
  end

  def deactivate!
    update!(status: :inactive)
  end
end
