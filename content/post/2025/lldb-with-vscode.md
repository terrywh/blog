+++

title =  "使用 vscode 配合 lldb 进行调试"
date = 2025-04-29
tags = ['c++', 'debug', 'lldb']
thumbnail = "https://llvm.org/img/LLVMWyvernSmall.png"

+++

> 通过搜索一般得到的推荐是安装额外的插件：https://marketplace.visualstudio.com/items?itemName=vadimcn.vscode-lldb   
> 这里提供另外一种形式，通过安装 llvm-mi 支持 cppdbg 实现；

* 问题

一般通过 `launch.json` 配置：
``` JSON
{
    ...
    "MIMode": "lldb",
    "miDebuggerPath": "/data/server/compiler/bin/lldb",
    ...
}
```

启动调试时会发生错误：
``` bash
error: unknown option: --interpreter=mi
error: unknown option: --tty=/dev/pts/1
Use 'lldb --help' for a complete list of options.
```

* 解决

在已经安装了 `lldb` 后，还需要额外编译安装 `lldb-mi` 组件（不是标准 `llvm-projects` 的一部分），：https://github.com/lldb-tools/lldb-mi

``` bash
wget -O lldb-mi-main.zip https://github.com/lldb-tools/lldb-mi/archive/refs/heads/main.zip
unzip lldb-mi-main.zip
cd lldb-mi-main/
mkdir stage
cd stage
CC=/data/server/compiler/bin/clang CXX=/data/server/compiler/bin/clang++ cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/data/server/compiler -DCMAKE_PREFIX_PATH=/data/server/compiler ../
make -j8
make install
```

注意：
1. `-DCMAKE_PREFIX_PATH=/data/server/compiler` 指定依赖的 lldb 安装路径（参考 [新版本 GCC / LLVM 安装](/post/2025/compiler-setup) 安装）
2. `-DCMAKE_INSTALL_PREFIX=/data/server/compiler` 合并安装；

并调整配置：
``` JSON
{
    ...
    "miDebuggerPath": "/data/server/compiler/bin/lldb-mi",
    ...
}
```

* 参考
> 奇怪为什么这个链接在文档中没有入口...
https://code.visualstudio.com/docs/cpp/lldb-mi
