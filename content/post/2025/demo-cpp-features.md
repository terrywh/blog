---

title: "C++ 功能演示"
date: 2025-03-28
tags: 
  - c++
thumbnail: "https://avatars.githubusercontent.com/u/32438672"
---

* `format` - [https://godbolt.org/z/6rxG4zoaj](https://godbolt.org/z/6rxG4zoaj)
> 从 C 集成的 printf 和 C++ 定义的类型安全的 iostream 复杂实现，均存在一些各自的缺陷和问题，在 C++20 中加入的 format 实现（基于 fmt 库）集合了前两者的优势；
> https://fmt.dev/latest/index.html (<=C++17)

* `spaceship operator <=>` - [https://godbolt.org/z/5797fKdhW](https://godbolt.org/z/5797fKdhW)
> 大幅的减少了需要重载的比较运算符；编译器会自动根据 `<=>` 生成实际比较运算的代码；

* `coroutine` - [https://godbolt.org/z/YcG8M4fzG](https://godbolt.org/z/YcG8M4fzG)
> 原生协程支持，有较高的自由度进行定制；

* `pipe operator` - [https://godbolt.org/z/GbfsKesaM](https://godbolt.org/z/GbfsKesaM)
> 直观使用 operator | 形态表达一个处理流程（配合 outcome::result 错误处理）；

* `proxy` - [https://godbolt.org/z/6oM34ePrz](https://godbolt.org/z/6oM34ePrz)
> 微软 Proxy 库新形态的“多态”机制；

* `return value optimization` - [https://godbolt.org/z/57W1sWrsP](https://godbolt.org/z/57W1sWrsP)
> 返回值优化机制及可能的特例演示；

* 