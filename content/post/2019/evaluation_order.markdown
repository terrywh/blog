---

title: "C++ 表达式求值顺序"
date: 2019-11-22
tags:
  - c++
  - debug
---

这两天突然碰到的一个问题，在开发和正式环境由于切换编译器导致了一些问题；下面的示例代码演示：

```
#include <iostream>

int test_evaluate_order(int a, int b, int c) {
    return a + b + c;
}

int fa() {
    std::cout << "1" << std::endl;
    return 1;
}
int fb() {
    std::cout << "2" << std::endl;
    return 2;
}
int fc() {
    std::cout << "3" << std::endl;
    return 3;
}

int main() {
    test_evaluate_order(fa(), fb(), fc());

    return 0;
}
```

上述代码在编译执行时：

1. 在 clang v9.0.0 版本下，运行输出：
```
1
2
3
```
2. 在 gcc v9.1 版本下，运行输出：
```
3
2
1
```

参见：[CompilerExplorer](https://godbolt.org/z/k4nTsA)

即上述编译器实现在对参数求值顺序 (`argument order of evaluation`) 的定义上刚好相反；若各参数求值存在依赖，这个顺序可能就会导致问题出现；

后查询标准确认 “C++ 标准中未对参数求值顺序进行规定” (`The order of evaluation of arguments is unspecified.`)，即两种实现方式均“符合标准”；包括在正常表达式计算中，也存在类似的说法；在 [stackoverflow.com](https://stackoverflow.com/questions/2934904/order-of-evaluation-in-c-function-parameters) 里存在对应问题的详细讨论；

故，在对于在（函数参数等）直接进行“计算”或“调用”的表达式，应尽量**不产生相互依赖**；在 《The C++ Programming Language》描述：

```
Better code can be generated in the absence of restrictions on expression evaluation order.
    --Bjarne Stroustrup
```
