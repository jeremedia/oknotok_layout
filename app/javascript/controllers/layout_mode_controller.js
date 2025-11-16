import { Controller } from "@hotwired/stimulus"

// Handles UI state for switching between real inventory and unlimited concept mode.
export default class extends Controller {
  static targets = ["toggle", "badge", "inventoryPanel"]

  connect() {
    this.currentMode = this.element.dataset.mode || "real_inventory"
    this.render()
  }

  switch(event) {
    event.preventDefault()
    const mode = event.currentTarget.dataset.mode
    if (!mode || mode === this.currentMode) return

    this.currentMode = mode
    this.render()
  }

  render() {
    this.toggleTargets.forEach((button) => {
      button.classList.toggle("active", button.dataset.mode === this.currentMode)
    })

    if (this.hasBadgeTarget) {
      this.badgeTarget.textContent = this.currentMode === "real_inventory" ? "Real Inventory" : "Concept Mode"
    }

    if (this.hasInventoryPanelTarget) {
      this.inventoryPanelTarget.classList.toggle("is-conceptual", this.currentMode !== "real_inventory")
    }
  }
}
