import { state, effect, computed } from "./core"
import { render, createElement } from "./render"
import "../style.css"

function App({ name }: { name: string }, componentState: any) {
  console.log("App function called with name:", name)

  if (!componentState.count) {
    componentState.count = state(0)
  }
  const count = componentState.count

  const doubleCount = computed(() => count.value * 2)

  effect(() => {
    console.log("Count effect running, current count:", count.value)
    console.log("Double count:", doubleCount.value)
  })

  console.log("Rendering App with count:", count.value)

  return (
    <div>
      <h1>
        Hello, {name} {count.value}!
      </h1>
      <p>Double count: {doubleCount.value}</p>
      <p>Welcome to JSX rendering in TypeScript.</p>
      <button
        onClick={() => {
          console.log("Button clicked, current count:", count.value)
          count.value++
          console.log("Count incremented, new value:", count.value)
        }}
      >
        Increment
      </button>
    </div>
  )
}

// Render to DOM
const root = document.getElementById("app")
if (root) {
  console.log("Root element found, rendering App")
  render(<App name="World" />, root)
} else {
  console.error("Root element not found")
}
