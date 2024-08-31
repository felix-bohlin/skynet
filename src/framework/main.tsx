import "../style.css"
import { effect, state } from "./core"
import { createElement, render } from "./render"

function App() {
  // State declarations
  const rotation = state(false)
  const materials = state(false)
  const lightHelpers = state(false)
  const shadows = state(false)
  const backdrop = state(false)
  const color = state("#ffffff")
  const lightIntensity = state(1)

  const allStates = {
    rotation,
    materials,
    lightHelpers,
    shadows,
    backdrop,
    color,
    lightIntensity,
  }

  // Effect for logging state changes
  effect(() => {
    console.table({
      State: Object.keys(allStates),
      Value: Object.values(allStates).map((state) => state.value),
      Type: Object.values(allStates).map((state) => typeof state.value),
    })
  })

  return (
    <div class="wrapper">
      <aside>
        {/* Input file */}
        <input type="file" id="fileInput" accept=".obj,.fbx" />

        {/* Rotation */}
        <label for="rotation">
          <input
            id="rotation"
            type="checkbox"
            checked={rotation.value}
            onClick={() => (rotation.value = !rotation.value)}
          />
          Rotation
        </label>

        {/* Materials */}
        <label for="materials">
          <input
            id="materials"
            type="checkbox"
            checked={materials.value}
            onClick={() => (materials.value = !materials.value)}
          />
          Materials
        </label>

        {/* Light Helpers */}
        <label for="lightHelpers">
          <input
            id="lightHelpers"
            type="checkbox"
            checked={lightHelpers.value}
            onClick={() => (lightHelpers.value = !lightHelpers.value)}
          />
          Light Helpers
        </label>

        {/* Shadows */}
        <label for="shadows">
          <input
            id="shadows"
            type="checkbox"
            checked={shadows.value}
            onClick={() => (shadows.value = !shadows.value)}
          />
          Shadows
        </label>

        {/* Backdrop */}
        <label for="backdrop">
          <input
            id="backdrop"
            type="checkbox"
            checked={backdrop.value}
            onClick={() => (backdrop.value = !backdrop.value)}
          />
          Backdrop
        </label>

        {/* Color Picker */}
        <label for="color">
          Color:
          <input
            id="color"
            type="color"
            value={color.value}
            onInput={(e) =>
              (color.value = (e.target as HTMLInputElement).value)
            }
          />
        </label>

        {/* Light Intensity Slider */}
        <label for="lightIntensity">
          Light Intensity:
          <input
            id="lightIntensity"
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={lightIntensity.value}
            onInput={(e) =>
              (lightIntensity.value = parseFloat(
                (e.target as HTMLInputElement).value,
              ))
            }
          />
        </label>
      </aside>
      <main></main>
    </div>
  )
}

// Render to DOM
const root = document.getElementById("app")
if (root) {
  console.log("Root element found, rendering App")
  render(<App />, root)
} else {
  console.error("Root element not found")
}
