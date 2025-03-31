Rails.application.routes.draw do
  get "layout_viewer/show"
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html
  get "layouts/:id/view", to: "layout_viewer#show", as: "view_layout" # Added this line

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  namespace :api do
    namespace :v1 do

      # ------ Alternative (and slightly cleaner) way to write the above: --------
      resources :layouts, only: [:index, :show, :create, :update, :destroy] do
        # Nested routes that require layout_id
        resources :brackets, only: [:index, :create]
        resources :beams, only: [:index, :create]
      end
      # Shallow routes that only require the resource's own ID
      resources :brackets, only: [:show, :update, :destroy]
      resources :beams, only: [:show, :update, :destroy]
      # ---------------------------------------------------------------------------

    end
  end

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  # root "posts#index"
end
