# app/controllers/api/v1/brackets_controller.rb
class Api::V1::BracketsController < ActionController::API
  before_action :set_layout, only: [:index, :create]
  before_action :set_bracket, only: [:show, :update, :destroy]

  # GET /api/v1/layouts/:layout_id/brackets
  def index
    @brackets = @layout.brackets # Fetch brackets belonging to the specified layout
    render json: @brackets
  end

  # GET /api/v1/brackets/:id
  def show
    render json: @bracket # @bracket is set by before_action
  end

  # POST /api/v1/layouts/:layout_id/brackets
  def create
    # Build the bracket associated with the layout found by set_layout
    @bracket = @layout.brackets.build(bracket_params)

    if @bracket.save
      render json: @bracket, status: :created # Render the created bracket, status 201
    else
      render json: { errors: @bracket.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/brackets/:id
  def update
    # Update the bracket found by set_bracket
    if @bracket.update(bracket_params)
      render json: @bracket # Render the updated bracket
    else
      render json: { errors: @bracket.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/brackets/:id
  def destroy
    # Destroy the bracket found by set_bracket
    # The dependent: :destroy in the Bracket model's has_many associations
    # for beams will handle deleting connected beams.
    if @bracket.destroy
      head :no_content # Respond with status 204 No Content
    else
      render json: { errors: @bracket.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  # Find the parent Layout based on :layout_id from the nested route
  def set_layout
    @layout = Layout.find(params[:layout_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Layout not found" }, status: :not_found
  end

  # Find the Bracket based on :id from the route
  def set_bracket
    @bracket = Bracket.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Bracket not found" }, status: :not_found
  end

  # Strong parameters for brackets
  # Only allow x, y, z coordinates. layout_id is set via association.
  def bracket_params
    params.require(:bracket).permit(:x, :y, :z)
  end
end