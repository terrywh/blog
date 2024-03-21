---

title: "新版本 GCC / LLVM 安装"
date: 2023-11-15
tags: 
  - c++
  - shell
categories: post

---

> 安装版本更新时间：2024-03-21 [gcc](https://gcc.gnu.org/releases.html)(13.2) / [llvm](https://github.com/llvm/llvm-project/releases)(18.1.2)

### 安装脚本

#### GCC
一般应考虑参考当前系统 GCC 编译选项 gcc -V 进行参数调整：
``` bash
wget https://ftp.gwdg.de/pub/misc/gcc/releases/gcc-13.2.0/gcc-13.2.0.tar.xz
tar xf gcc-13.2.0.tar.xz
cd gcc-13.2.0
./contrib/download_prerequisites # 下载依赖源码
mkdir stage
cd stage
../configure --enable-bootstrap --enable-languages=c,c++,lto --prefix=/data/server/compiler --enable-shared --enable-threads=posix --enable-checking=release --disable-multilib --with-system-zlib --enable-__cxa_atexit --disable-libunwind-exceptions --enable-gnu-unique-object --enable-linker-build-id --with-gcc-major-version-only --with-linker-hash-style=gnu --enable-plugin --enable-initfini-array --with-isl --disable-libmpx --enable-offload-targets=nvptx-none --without-cuda-driver --enable-gnu-indirect-function --enable-cet --with-tune=generic --with-arch_32=x86-64 --build=x86_64-redhat-linux
make -j8
make install
```

请参考 [配置 GDB PrettyPrint 支持]({%post_url 2023-11-15-gdb-with-pretty-print %}) 

#### LLVM
重合上面 GCC 安装，自动融合使用；注意，部分系统环境可能不允许如 `pstl` / `libunwind` 同时编译输出：
``` bash
wget https://github.com/llvm/llvm-project/releases/download/llvmorg-18.1.2/llvm-project-18.1.2.src.tar.xz
tar xf llvm-project-18.1.2.src.tar.xz
cd llvm-project-18.1.2.src
mkdir stage
cd stage
CC=/data/server/compiler/bin/gcc CXX=/data/server/compiler/bin/g++ cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/data/server/compiler -DLLVM_ENABLE_PROJECTS="clang;clang-tools-extra;lld;lldb;openmp;polly;pstl" -DLLVM_ENABLE_RUNTIMES="compiler-rt;libcxx;libcxxabi;libunwind" -DCMAKE_CXX_LINK_FLAGS="-Wl,-rpath,/data/server/compiler/lib64 -L/data/server/compiler/lib64" ../llvm
make -j8
make install
```

### 环境配置

配置启用工具链：
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


配置动态库加载路径：
``` bash
echo "/data/server/compiler/lib64" > /etc/ld.so.conf.d/compiler_x86_64.conf
echo "/data/server/compiler/lib"  >> /etc/ld.so.conf.d/compiler_x86_64.conf
ldconfig
```
