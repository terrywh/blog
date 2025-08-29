+++

title =  "新版本 GCC / LLVM 安装"
date = 2025-05-19
tags = ['c++', 'shell']
thumbnail = "https://llvm.org/img/LLVMWyvernSmall.png"
toc = true

+++

* 安装版本更新时间：2025-08-29 [gcc](https://gcc.gnu.org/releases.html)(15.2) / [llvm](https://github.com/llvm/llvm-project/releases)(21.1.0)

## 依赖
各种系统缺失的依赖组件不尽相同，常见容易缺失的组件可以考虑下面安装命令：
``` bash
yum install -y doxygen libxml2-devel swig python3-devel cmake ninja-build
```

## 安装

### GCC
注意参考当前系统 GCC 编译选项 `gcc -v` 并进行简单调整：
* 确认 `multilib` 的启用状态；
* 确认 `unwind-exception` 的启用状态；
* 确认 `arch_32` 架构相关参数；
* 去除如 `bugurl` 等无关参数；

    ``` bash
    wget https://ftp.gnu.org/gnu/gcc/gcc-15.2.0/gcc-15.2.0.tar.xz
    tar xf gcc-15.2.0.tar.xz
    cd gcc-15.2.0
    ./contrib/download_prerequisites # 下载依赖组件
    mkdir stage
    cd stage
    ../configure --enable-bootstrap --enable-languages=c,c++,lto --prefix=/data/server/compiler --enable-shared --enable-threads=posix --enable-checking=release --disable-multilib --with-system-zlib --enable-__cxa_atexit --enable-gnu-unique-object --enable-linker-build-id --enable-libstdcxx-backtrace --with-linker-hash-style=gnu --enable-plugin --enable-initfini-array --without-isl --enable-gnu-indirect-function --enable-cet --with-tune=generic --with-arch_32=i686 --with-build-config=bootstrap-lto --enable-link-serialization=1
    make -j8
    make install
    ```

* 若下载依赖组件步骤出现问题或极其缓慢可考虑寻找镜像地址自行下载对应版本：
  * https://gcc.gnu.org/mirrors.html  # /infstructure
  * https://www.gnu.org/prep/ftp.html # /gmp | /mpfr | /mpc | /gettext
  * https://libisl.sourceforge.io/    # /isl

* 请参考 [配置 GDB PrettyPrint 支持]({{% ref "/post/2025/gdb-with-pretty-print" %}})
* 可以使用 Bun/Shell 执行脚本自动安装最新版本:
    ``` bash
    curl -fsSL {{% param baseURL %}}/post/2025/compiler-setup-gcc.js | bun -
    ```

### LLVM
重合上面 GCC 安装，自动融合使用；注意:
* GCC 若禁用了 `libunwind-exception` 对应 `llvm` 的 `libunwind` 可能无法构建成功；
* GCC 编译 `llvm` 的代码可能出现 `warning` 默认会导致编译失败；
* 下面编译过程分离了 projects / runtimes 的构建，能够更加兼容适配不同的构建环境（实测的两台虚机其中一台再同时构建 projects/runtimes 时会发生错误）；
* 使用 `Ninja` 作为编译命令能稍微加快构建速度；
* 相关参数参考：https://llvm.org/docs/CMake.html

    ``` bash
    wget https://github.com/llvm/llvm-project/releases/download/llvmorg-21.1.0/llvm-project-21.1.0.src.tar.xz
    tar xf llvm-project-21.1.0.src.tar.xz
    cd llvm-project-21.1.0.src
    # project
    CC=/data/server/compiler/bin/gcc CXX=/data/server/compiler/bin/g++ cmake -G Ninja -B stage_projects -S llvm -Wno-dev -DLLVM_ENABLE_RTTI=ON -DCMAKE_CXX_LINK_FLAGS="-Wl,-rpath,/data/server/compiler/lib64 -L/data/server/compiler/lib64" -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/data/server/compiler -DLLVM_ENABLE_PROJECTS="clang;clang-tools-extra;lld;lldb;openmp;polly;pstl"
    ninja -C stage_projects -j8
    ninja -C stage_projects install
    # runtime
    CC=/data/server/compiler/bin/clang CXX=/data/server/compiler/bin/clang++ cmake -G Ninja -B stage_runtimes -S runtimes -Wno-dev -DLLVM_ENABLE_RTTI=ON -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/data/server/compiler -DLLVM_ENABLE_RUNTIMES="compiler-rt;libcxx;libcxxabi;libunwind"

    ninja -C stage_runtimes -j8
    ninja -C stage_runtimes install
    ```
* 可以使用 Bun/Shell 执行脚本自动安装最新版本:
    ``` bash
    curl -fsSL {{% param baseURL %}}/post/2025/compiler-setup-llvm.js | bun -
    ```

## 配置
### 启用工具链
    优先启用工具链，否则可能在后续安装 clang 的过程中出现依赖错误导致的编译问题；

    ``` bash
    #@file="/data/server/compiler/enable"

    # 可选指定默认编译器
    # export CC=/data/server/compiler/bin/gcc
    # export CXX=/data/server/compiler/bin/g++
    # 执行路径
    export PATH=/data/server/compiler/bin${PATH:+:${PATH}}
    # 文档路径
    export MANPATH=/data/server/compiler/share/man${MANPATH:+:${MANPATH}}
    export INFOPATH=/data/server/compiler/share/info${INFOPATH:+:${INFOPATH}}
    # 加载路径
    export LD_LIBRARY_PATH=/data/server/compiler/lib:/data/server/compiler/lib64${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}
    ```

### 动态库加载
``` bash
echo "/data/server/compiler/lib64" > /etc/ld.so.conf.d/compiler_x86_64.conf
echo "/data/server/compiler/lib"  >> /etc/ld.so.conf.d/compiler_x86_64.conf
ldconfig
```

## 应用
### 使用 libc++/c++abi 库
``` bash
clang++ main.cpp -stdlib=libc++ -static-libstdc++ -static-libgcc -fuse-ld=lld -L/data/server/compiler/lib -Wl,-Bstatic -lc++ -lc++abi -Wl,-Bdynamic -o main -v
```

* 上述命令使用 lld 静态链接 c++ / gcc_s 依赖库；
* 需要额外的库链接指令避免出现符号未定义情况；
