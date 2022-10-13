+++

title = "C++ 20 功能笔记"
date = "2021-07-21"
tags = ["c++", "gcc", "abstraction"]
cover = "/images/default-cover.png"
categories = "笔记"

+++

* format - [https://godbolt.org/z/6rxG4zoaj](https://godbolt.org/z/6rxG4zoaj)
从 C 集成的 printf 和 C++ 定义的类型安全的 iostream 复杂实现，均存在一些各自的缺陷和问题，在 C++20 中加入的 format 实现（基于 fmt 库）似乎实现了结合双方的优势；

    > https://fmt.dev/latest/index.html (<=C++17)

* spaceship operator <=> - [https://godbolt.org/z/5797fKdhW](https://godbolt.org/z/5797fKdhW)
大幅的减少了需要重载的比较运算符；编译器会自动根据 `<=>` 生成实际比较运算的代码；

* 