---

title: "新版本 GCC / LLVM 安装"
date: 2023-11-15
tags: 
  - c++
  - shell

categories: post

---

## {{page.title}}
> 更新：(2024-02-06)
* [gcc](https://gcc.gnu.org/releases.html) - 13.2
* [llvm](https://github.com/llvm/llvm-project/releases) - 17.0.6

### 安装脚本

#### GCC
> 考虑参考当前系统 GCC 编译选项 gcc -V

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

#### LLVM
> 重合上面 GCC 安装，自动融合使用

``` bash
wget https://github.com/llvm/llvm-project/releases/download/llvmorg-17.0.6/llvm-project-17.0.6.src.tar.xz
tar xf llvm-project-17.0.6.src.tar.xz
cd llvm-project-17.0.6.src
mkdir stage
cd stage
CC=/data/server/compiler/bin/gcc CXX=/data/server/compiler/bin/g++ cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/data/server/compiler -DLLVM_ENABLE_PROJECTS="clang;clang-tools-extra;lld;lldb;openmp;polly;pstl" -DLLVM_ENABLE_RUNTIMES="compiler-rt;libcxx;libcxxabi;libunwind" -DCMAKE_CXX_LINK_FLAGS="-Wl,-rpath,/data/server/compiler/lib64 -L/data/server/compiler/lib64" ../llvm
make -j8
make install
```

### 环境配置

#### 启用路径
``` bash
# /data/server/compiler/enable
export PATH=/data/server/compiler/bin${PATH:+:${PATH}}
export MANPATH=/data/server/compiler/share/man${MANPATH:+:${MANPATH}}
export INFOPATH=/data/server/compiler/share/info${INFOPATH:+:${INFOPATH}}
export LD_LIBRARY_PATH=/data/server/compiler/lib:/data/server/compiler/lib64${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}
```


#### 加载路径
``` bash
echo "/data/server/compiler/lib64" > /etc/ld.so.conf.d/compiler_x86_64.conf
echo "/data/server/compiler/lib"  >> /etc/ld.so.conf.d/compiler_x86_64.conf
ldconfig
```
