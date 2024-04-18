---

title: "新版本 GCC / LLVM 安装"
date: 2023-11-15
tags: 
  - c++
  - shell
categories: post

---

> 安装版本更新时间：2024-04-18 [gcc](https://gcc.gnu.org/releases.html)(13.2) / [llvm](https://github.com/llvm/llvm-project/releases)(18.1.4)

### 安装脚本

#### 缺失依赖
各种系统缺失的依赖组件不尽相同，常见容易缺失的组件可以考虑下面安装命令：
``` bash
yum install -y ninja-build doxygen libxml2-devel swig python3-devel
```

#### GCC
应考注意参考当前系统 GCC 编译选项 `gcc -v` 并进行简单调整：
* 确认 `multilib` 的启用状态；
* 确认 `unwind-exception` 的启用状态；
* 去除如 `bugurl` 等无关参数；

``` bash
wget https://ftp.gwdg.de/pub/misc/gcc/releases/gcc-13.2.0/gcc-13.2.0.tar.xz
tar xf gcc-13.2.0.tar.xz
cd gcc-13.2.0
./contrib/download_prerequisites # 下载依赖源码
mkdir stage
cd stage
../configure --enable-bootstrap --enable-languages=c,c++,lto --prefix=/data/server/compiler --enable-shared --enable-threads=posix --enable-checking=release --disable-multilib --with-system-zlib --enable-__cxa_atexit  --enable-gnu-unique-object --enable-linker-build-id --with-gcc-major-version-only --with-linker-hash-style=gnu --enable-plugin --enable-initfini-array --with-isl --disable-libmpx --enable-offload-targets=nvptx-none --without-cuda-driver --enable-gnu-indirect-function --enable-cet --with-tune=generic --with-arch_32=x86-64 --build=x86_64-redhat-linux
make -j8
make install
```

请参考 [配置 GDB PrettyPrint 支持]({%post_url 2023-11-15-gdb-with-pretty-print %}) 

#### 启用工具链
> 优先启用工具链，否则可能在后续安装 clang 的过程中出现依赖错误导致的编译问题；

``` bash
# file="/data/server/compiler/enable"
# 指定默认编译器
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
* 使用 `Ninja` 作为编译命令能稍微加快构建速度；
* 相关参数参考：https://llvm.org/docs/CMake.html
``` bash
wget https://github.com/llvm/llvm-project/releases/download/llvmorg-18.1.4/llvm-project-18.1.4.src.tar.xz
tar xf llvm-project-18.1.4.src.tar.xz
cd llvm-project-18.1.4.src
mkdir stage
cd stage
CC=/data/server/compiler/bin/gcc CXX=/data/server/compiler/bin/g++ cmake -G Ninja -Wno-dev -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/data/server/compiler -DLLVM_ENABLE_PROJECTS="clang;clang-tools-extra;lld;lldb;polly;pstl" -DLLVM_ENABLE_RUNTIMES="compiler-rt;libcxx;libcxxabi;libunwind;openmp" -DLLVM_ENABLE_RTTI=ON -DLLVM_ENABLE_WERROR=OFF -DCMAKE_CXX_LINK_FLAGS="-Wl,-rpath,/data/server/compiler/lib64 -L/data/server/compiler/lib64" ../llvm
ninja -j8
ninja install
```

#### 动态库加载
``` bash
echo "/data/server/compiler/lib64" > /etc/ld.so.conf.d/compiler_x86_64.conf
echo "/data/server/compiler/lib"  >> /etc/ld.so.conf.d/compiler_x86_64.conf
ldconfig
```
