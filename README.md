# WebAssembly 与 JS 调用的开销测试

## 对比代码

1. JavaScript -> WASM via ccall
2. JavaScript -> WASM directly

## 测试环境

* 2018 Mac mini
* Intel i7 3.2Ghz
* 64G DDR4 2667 RAM
* macOS Monterey 12.0.1

## 结果

数值代表完成操作所需的时间，单位是毫秒，越低越好。

|                             |              | WASM ccall    | WASM directly | WASM C++ |
|---------------------------- | ------------ | ------------- | ------------- | -------- |
| Safari 15.1                 | new 10k elem | 256ms         | 138ms         | 49ms     |
|                             | restruct 10k | 18ms          | 18ms          | 21ms     |
| Chrome 97.0.4692.99         | new 10k elem | 225ms         | 126ms         | 100ms    |
|                             | restruct 10k | 23ms          | 32ms          | 44ms     |

Keypoint:

* 过 Bridge 的调用开销，在参数不复杂的情况下，大概是每次调用 0.001ms ~ 0.0001ms 这个数量级
* 直接在堆上分配内存来传递参数的调用方式，对 ccall 有着一倍的性能提升
* C++ 内部调用是 JS -> WebAssembly 的 3 倍性能

## 场景

### 初始化节点

* 初始化 10k 个 element
* 每个 element 30 个 attr
* 每一轮大概 300k 次 js -> webassembly 请求

### 重排树

* 对于 10k 个 element，每 100 个 element 重排成一颗子树
* 每一轮大概 20k 次 js -> webassembly 请求

## TODO

* [ ] Big Payload
* [ ] Fatigue test
* [ ] Memory Usage
* [ ] EMScripten Class Binding
