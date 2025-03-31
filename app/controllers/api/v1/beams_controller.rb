# app/controllers/api/v1/beams_controller.rb
class Api::V1::BeamsController < ActionController::API
  before_action :set_layout, only: [:index, :create]
  before_action :set_beam, only: [:show, :update, :destroy]

  # GET /api/v1/layouts/:layout_id/beams
  def index
    @beams = @layout.beams # Fetch beams belonging to the specified layout
    render json: @beams
  end

  # GET /api/v1/beams/:id
  def show
    render json: @beam # @beam is set by before_action
  end

  # POST /api/v1/layouts/:layout_id/beams
  def create
    # Build the beam associated with the layout found by set_layout
    @beam = @layout.beams.build(beam_params)

    # Optional: Add validation logic here to ensure start/end brackets exist
    # within the *same* layout before saving, if needed. The foreign key
    # constraint helps, but application-level checks can be clearer.

    if @beam.save
      render json: @beam, status: :created # Render the created beam, status 201
    else
      render json: { errors: @beam.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/beams/:id
  def update
    # Update the beam found by set_beam
    # Optional: Add validation logic here if changing connections
    if @beam.update(beam_params)
      render json: @beam # Render the updated beam
    else
      render json: { errors: @beam.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/beams/:id
  def destroy
    # Destroy the beam found by set_beam
    if @beam.destroy
      head :no_content # Respond with status 204 No Content
    else
      render json: { errors: @beam.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  # Find the parent Layout based on :layout_id from the nested route
  def set_layout
    @layout = Layout.find(params[:layout_id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Layout not found" }, status: :not_found
  end

  # Find the Beam based on :id from the route
  def set_beam
    @beam = Beam.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Beam not found" }, status: :not_found
  end

  # Strong parameters for beams
  def beam_params
    params.require(:beam).permit(
      :beam_type,
      :length,
      :start_bracket_id, # ID of the bracket where the beam starts
      :end_bracket_id,   # ID of the bracket where the beam ends (can be null)
      :start_socket,     # Name of the socket used on the start bracket (e.g., '+x')
      :end_socket        # Name of the socket used on the end bracket (can be null)
    )
  end
end