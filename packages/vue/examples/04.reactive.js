// vue3响应式探索

function reactive(obj) {
  // obj 代理对象，{}处理器
  //   返回代理对象
  return new Proxy(obj, {
    // 获取
    get(target, key, receiver) {
      // receiver是拦截对象的本身
      //Reflect 可以得到处理过的值，targe[key],如果报错还能捕抓错误
      const res = Reflect.get(target, key, receiver)
      //   最终
      track(target, key)
      console.log('get', key)
      //   taget 是obj 对象
      return typeof res === 'object' ? reactive(res) : res
    },
    // 新增 更新
    set(target, key, val, receiver) {
      const res = Reflect.set(target, key, val, receiver)
      console.log('set', key)
      //   触发副作用函数
      trigger(target, key)
      return res
    },
    // 删除
    deleteProperty(target, key, receiver) {
      const res = Reflect.deleteProperty(target, key, receiver)
      console.log('deleteProperty', key)
      return res
    }
  })
}

// 副作用函数数组
// 等effect结束后这个数组应该清空
const effectStack = []

// 依赖
function effect(fn) {
  // 错误处理
  const e = createReactiveEffect(fn)
  //   call e
  e()
  console.log('effectStack--effect', effectStack)
  //   返回
  return e
}
function createReactiveEffect(fn) {
  const effect = function(...args) {
    try {
      // 将带错误处理fn 入栈
      effectStack.push(effect)
      console.log('effectStack,createReactiveEffect', effectStack)
      //   执行
      //   可能报错，可以做报错处理
      //   这里触发了tarck 里面有  state.foo)
      return fn(...args)
    } finally {
      // 出栈
      //原因可能有嵌套，每建立一次依赖就出栈
      effectStack.pop()
      console.log('effectStack,createReactiveEffect finally', effectStack)
    }
  }
  //
  return effect
}
// 保存数据结果
const targetMap = new WeakMap()
// 建立 targe key 映射关系
function track(target, key) {
  // 获取副作用函数递归啊。里面的那个？
  console.log('effectStack,track', effectStack)
  const effect = effectStack[effectStack.length - 1]
  if (effect) {
    //   1. 根据target 获取map,
    let depMap = targetMap.get(target)
    console.log('target', target)
    // 首次访问
    if (!depMap) {
      depMap = new Map()
      //   key  target value  depMap
      targetMap.set(target, depMap)
      console.log('depMap', depMap)
    }
    console.log('targetMap', targetMap)
    // key,对应的set
    let deps = targetMap.get(key)
    console.log('targetMap deps', targetMap)
    // 首次访问
    if (!deps) {
      deps = new Set()
      //   key  target value  depMap
      depMap.set(key, deps)
      console.log('key', key)
      console.log('targetMap deps', targetMap)
      console.log('depMap deps', depMap)
    }
    // add副作用函数
    deps.add(effect)
    console.log('des add', deps)
  }
}
// 触发
function trigger(target, key) {
  // 拿出来
  const depMap = targetMap.get(target)
  if (!depMap) {
    return
  }
  //   获取key
  const deps = depMap.get(key)
  if (deps) {
    deps.forEach(dep => {
      // 副作用函数
      dep()
    })
  }
}

// 优点：
// 减少遍历
const state = reactive({
  foo: 'foo',
  //   嵌套代理
  bar: {
    baz: '1'
  }
})

effect(() => {
  console.log('effect1', state.foo)
})

effect(() => {
  console.log('effect2', state.foo, state.bar.baz)
  //   嵌套，这个是stack队尾
  //   effect(()=>{

  //   })
})

state.foo
state.foo = 'fooooooo'
// 动态新增 删除
// state.bar = 'bar'
// delete state.bar
state.bar.baz = 10
