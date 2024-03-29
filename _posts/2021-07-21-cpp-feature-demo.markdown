---

title: "C++ 功能演示"
date: 2021-07-21
tags: 
  - c++
categories: post

---

* `format` - [https://godbolt.org/z/6rxG4zoaj](https://godbolt.org/z/6rxG4zoaj)
> 从 C 集成的 printf 和 C++ 定义的类型安全的 iostream 复杂实现，均存在一些各自的缺陷和问题，在 C++20 中加入的 format 实现（基于 fmt 库）集合了前两者的优势；
> https://fmt.dev/latest/index.html (<=C++17)

* `spaceship operator <=>` - [https://godbolt.org/z/5797fKdhW](https://godbolt.org/z/5797fKdhW)
> 大幅的减少了需要重载的比较运算符；编译器会自动根据 `<=>` 生成实际比较运算的代码；

* `coroutine` - [https://godbolt.org/z/YcG8M4fzG](https://godbolt.org/z/YcG8M4fzG)
> 原生协程支持，有较高的自由度进行定制；

* `pipe operator` [https://godbolt.org/z/GbfsKesaM](https://godbolt.org/z/GbfsKesaM)
> 直观使用 operator | 形态表达一个处理流程（配合 outcome::result 错误处理）；

