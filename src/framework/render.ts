import { effect } from "./core"

type Props = { [key: string]: any }
type Child = string | number | boolean | null | undefined | VNode

interface VNode {
  type: string | Function
  props: Props
  children: Child[]
}

export function createElement(
  type: string | Function,
  props: Props | null,
  ...children: Child[]
): VNode {
  return {
    type,
    props: props || {},
    children: children.flat(),
  }
}

interface ComponentState {
  mounted: boolean
  onMount?: () => void
  onUpdate?: () => void
  onUnmount?: () => void
}

const componentStates = new WeakMap<Function, ComponentState>()

function createDOMElement(vnode: Child): Node {
  if (
    typeof vnode === "string" ||
    typeof vnode === "number" ||
    typeof vnode === "boolean"
  ) {
    return document.createTextNode(vnode.toString())
  }

  if (vnode == null) {
    return document.createTextNode("")
  }

  if (typeof vnode.type === "function") {
    // Handle functional components
    let componentState = componentStates.get(vnode.type)
    if (!componentState) {
      componentState = { mounted: false }
      componentStates.set(vnode.type, componentState)
    }
    const result = vnode.type(vnode.props, componentState)
    const element = createDOMElement(result)

    if (!componentState.mounted) {
      componentState.mounted = true
      if (componentState.onMount) {
        componentState.onMount()
      }
    } else if (componentState.onUpdate) {
      componentState.onUpdate()
    }

    return element
  }

  const element = document.createElement(vnode.type as string)

  Object.entries(vnode.props).forEach(([name, value]) => {
    if (name.startsWith("on") && name.toLowerCase() in window) {
      element.addEventListener(
        name.toLowerCase().substr(2),
        value as EventListener,
      )
    } else {
      element.setAttribute(name, value as string)
    }
  })

  vnode.children.forEach((child) => {
    element.appendChild(createDOMElement(child))
  })

  return element
}

let oldVNode: VNode | null = null

export function render(vnode: VNode, container: Element | null) {
  if (!container) return

  effect(() => {
    if (!oldVNode) {
      // Initial render
      container.innerHTML = ""
      container.appendChild(createDOMElement(vnode))
    } else {
      // Update: replace the entire content
      // This is a simple form of re-rendering, not as efficient as diffing
      const oldContent = container.firstChild
      const newContent = createDOMElement(vnode)
      if (oldContent) {
        container.replaceChild(newContent, oldContent)
      } else {
        container.appendChild(newContent)
      }

      // Call onUnmount for old components
      if (typeof oldVNode.type === "function") {
        const oldComponentState = componentStates.get(oldVNode.type)
        if (oldComponentState && oldComponentState.onUnmount) {
          oldComponentState.onUnmount()
        }
      }
    }

    oldVNode = vnode
  })
}
//
//
//
//
// Global declarations for JSX
declare global {
  namespace JSX {
    interface Element extends VNode {}
    interface IntrinsicElements {
      // Main root
      html: any

      // Document metadata
      head: any
      title: any
      base: any
      link: any
      meta: any
      style: any

      // Sectioning root
      body: any

      // Content sectioning
      article: any
      section: any
      nav: any
      aside: any
      h1: any
      h2: any
      h3: any
      h4: any
      h5: any
      h6: any
      header: any
      footer: any
      address: any
      main: any

      // Text content
      p: any
      hr: any
      pre: any
      blockquote: any
      ol: any
      ul: any
      li: any
      dl: any
      dt: any
      dd: any
      figure: any
      figcaption: any
      div: any

      // Inline text semantics
      a: any
      em: any
      strong: any
      small: any
      s: any
      cite: any
      q: any
      dfn: any
      abbr: any
      ruby: any
      rb: any
      rt: any
      rtc: any
      rp: any
      data: any
      time: any
      code: any
      var: any
      samp: any
      kbd: any
      sub: any
      sup: any
      i: any
      b: any
      u: any
      mark: any
      bdi: any
      bdo: any
      span: any
      br: any
      wbr: any

      // Image and multimedia
      img: any
      audio: any
      video: any
      source: any
      track: any
      map: any
      area: any

      // Embedded content
      iframe: any
      embed: any
      object: any
      param: any
      picture: any
      portal: any

      // SVG and MathML
      svg: any
      math: any

      // Scripting
      script: any
      noscript: any
      canvas: any

      // Demarcating edits
      del: any
      ins: any

      // Table content
      table: any
      caption: any
      colgroup: any
      col: any
      tbody: any
      thead: any
      tfoot: any
      tr: any
      td: any
      th: any

      // Forms
      form: any
      label: any
      input: any
      button: any
      select: any
      datalist: any
      optgroup: any
      option: any
      textarea: any
      output: any
      progress: any
      meter: any
      fieldset: any
      legend: any

      // Interactive elements
      details: any
      summary: any
      dialog: any

      // Web Components
      slot: any
      template: any
    }
  }
}
