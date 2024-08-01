---

title: "新版本 GCC / LLVM 安装"
date: 2023-11-15
tags: 
  - c++
  - shell
categories: post

---

> 安装版本更新时间：2024-07-12 [gcc](https://gcc.gnu.org/releases.html)(14.1) / [llvm](https://github.com/llvm/llvm-project/releases)(18.1.8)

### 安装脚本

#### 缺失依赖
各种系统缺失的依赖组件不尽相同，常见容易缺失的组件可以考虑下面安装命令：
``` bash
yum install -y doxygen libxml2-devel swig python3-devel cmake ninja-build
```

#### GCC
应考注意参考当前系统 GCC 编译选项 `gcc -v` 并进行简单调整：
* 确认 `multilib` 的启用状态；
* 确认 `unwind-exception` 的启用状态；
* 去除如 `bugurl` 等无关参数；

``` bash
wget https://gcc.gnu.org/pub/gcc/releases/gcc-14.1.0/gcc-14.1.0.tar.xz
tar xf gcc-14.1.0.tar.xz
cd gcc-14.1.0
./contrib/download_prerequisites # 下载依赖组件
mkdir stage
cd stage
../configure --enable-bootstrap --enable-languages=c,c++,lto --prefix=/data/server/compiler --enable-shared --enable-threads=posix --enable-checking=release --disable-multilib --with-system-zlib --enable-__cxa_atexit --enable-gnu-unique-object --enable-linker-build-id --with-gcc-major-version-only --with-linker-hash-style=gnu --enable-plugin --enable-initfini-array --with-isl --disable-libmpx --enable-offload-targets=nvptx-none --without-cuda-driver --enable-gnu-indirect-function --enable-cet --with-tune=generic --with-arch_32=x86-64 --build=x86_64-redhat-linux
make -j8
make install
```

请参考 [配置 GDB PrettyPrint 支持]({%post_url 2023-11-15-gdb-with-pretty-print %}) 

#### 启用工具链
> 优先启用工具链，否则可能在后续安装 clang 的过程中出现依赖错误导致的编译问题；

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

#### LLVM
重合上面 GCC 安装，自动融合使用；注意:
* GCC 若禁用了 `libunwind-exception` 对应 `llvm` 的 `libunwind` 可能无法构建成功；
* GCC 编译 `llvm` 的代码可能出现 `warning` 默认会导致编译失败；
* 下面编译过程分离了 projects / runtimes 的构建，能够更加兼容适配不同的构建环境（实测的两台虚机其中一台再同时构建 projects/runtimes 时会发生错误）；
* 使用 `Ninja` 作为编译命令能稍微加快构建速度；
* 相关参数参考：https://llvm.org/docs/CMake.html

``` bash
wget https://github.com/llvm/llvm-project/releases/download/llvmorg-18.1.8/llvm-project-18.1.8.src.tar.xz
tar xf llvm-project-18.1.8.src.tar.xz
cd llvm-project-18.1.8.src
# project
CC=/data/server/compiler/bin/gcc CXX=/data/server/compiler/bin/g++ cmake -G Ninja -B stage_projects -S llvm -Wno-dev -DLLVM_ENABLE_RTTI=ON -DCMAKE_CXX_LINK_FLAGS="-Wl,-rpath,/data/server/compiler/lib64 -L/data/server/compiler/lib64" -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/data/server/compiler -DLLVM_ENABLE_PROJECTS="clang;clang-tools-extra;lld;lldb;openmp;polly;pstl"
ninja -C stage_projects -j8
ninja -C stage_projects install
# runtime 
CC=/data/server/compiler/bin/clang CXX=/data/server/compiler/bin/clang++ cmake -G Ninja -B stage_runtimes -S runtimes -Wno-dev -DLLVM_ENABLE_RTTI=ON -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/data/server/compiler -DLLVM_ENABLE_RUNTIMES="compiler-rt;libcxx;libcxxabi;libunwind"

ninja -C stage_runtimes -j8
ninja -C stage_runtimes install
```

#### 动态库加载
``` bash
echo "/data/server/compiler/lib64" > /etc/ld.so.conf.d/compiler_x86_64.conf
echo "/data/server/compiler/lib"  >> /etc/ld.so.conf.d/compiler_x86_64.conf
ldconfig
```


#### 使用 libc++/c++abi 库
``` bash
clang++ main.cpp -stdlib=libc++ -static-libstdc++ -static-libgcc -fuse-ld=lld -L/data/server/compiler/lib -Wl,-Bstatic -lc++ -lc++abi -Wl,-Bdynamic -o main -v
```
* 上述命令使用 lld 静态链接 c++ / gcc_s 依赖库；
* 需要额外的库链接指令避免出现符号未定义情况；