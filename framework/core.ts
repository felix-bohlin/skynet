type Effect = () => void
type TargetMap = WeakMap<object, Map<string | symbol, Set<Effect>>>

let activeEffect: Effect | undefined
const targetMap: TargetMap = new WeakMap()

function track(target: object, key: string | symbol) {
  if (activeEffect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = new Set()))
    }
    dep.add(activeEffect)
  }
}

function trigger(target: object, key: string | symbol) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const dep = depsMap.get(key)
  if (dep) {
    dep.forEach((effect) => {
      if (effect !== activeEffect) {
        effect()
      }
    })
  }
}

export function reactive<T extends object>(target: T): T {
  const handler: ProxyHandler<T> = {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver)
      track(target, key)
      return result
    },
    set(target, key, value, receiver) {
      const oldValue = Reflect.get(target, key, receiver)
      const result = Reflect.set(target, key, value, receiver)
      if (oldValue !== value) {
        trigger(target, key)
      }
      return result
    },
  }
  return new Proxy(target, handler)
}

export function effect(fn: Effect) {
  const wrappedEffect = () => {
    activeEffect = wrappedEffect
    fn()
    activeEffect = undefined
  }
  wrappedEffect()
  return wrappedEffect
}

export function state<T>(initialValue: T): { value: T } {
  return reactive({ value: initialValue })
}

// New function to create a computed value
export function computed<T>(getter: () => T): { value: T } {
  const result = state<T>(getter())
  effect(() => {
    result.value = getter()
  })
  return result
}
