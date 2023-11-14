+++

title = "新版本 CLANG 安装"
date = "2023-11-15"
tags = ["c++", "gcc", "clang", "abstraction", "feature", "note"]
cover = "/images/default-cover.png"
categories = "笔记"

+++

* 获取并下载 LLVM 项目源代码：https://github.com/llvm/llvm-project/releases
```
wget https://github.com/llvm/llvm-project/releases/download/llvmorg-17.0.4/llvm-project-17.0.4.src.tar.xz
```

* 编译安装
```
tar xf llvm-project-17.0.4.src.tar.xz
cd llvm-project-17.0.4.src
mkdir stage
cd stage
cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/data/server/llvm-17.0 -DLLVM_ENABLE_PROJECTS="clang;clang-tools-extra;lld;lldb;openmp;polly;pstl" -DLLVM_ENABLE_RUNTIMES="compiler-rt;libcxx;libcxxabi;libunwind" ../llvm
make -j8
make install
```

* 使用非标编译器
```
CC=gcc CXX=g++ cmake ...
```
