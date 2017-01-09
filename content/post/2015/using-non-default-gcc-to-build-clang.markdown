---

title: "更新 GCC 后引起的 clang 安装问题"
date: 2015-12-03
tags:
  - c++
  - clang
  - gcc

---

![clang](/images/2015/clang-install-1.png)

> 安装了新版本 GCC 后，附加 rpath 参数编译安装 CLANG 解决找不到对应新版本的 libstdc++.so 库的问题

首先我在 CentOS 7 上面编译安装了 GCC 5.2.0 到 `/usr/local` 然后删除了自带的 GCC：

```
# gcc-5.2.0
./contrib/download_prerequisites
# gcc-stage
../gcc-5.2.0/configure --disable-mulitlib --enable-languages=c,c++,go
make -j4
make install
yum remove gcc gcc-c++
```

安装 clang/llvm 大概需要下载这两个的包，让后把 clang 的包放进 llvm 的 tools 下面，然后：

``` bash
../llvm-3.7.0.src/configure --enable-optimized --enable-targets=host-only --enable-cxx1y --with-gcc-toolchain=/usr/local
make LDFLAGS+="-Wl,-rpath,/usr/local/lib64 -L/usr/local/lib64"
```

上面命令指定 rpath 为了解决一个跟 libstdc++ 版本有关的问题（编译时没有找到新版本 GCC 提供的 `libstdc++.so` 存在 `/usr/local/lib64` 中)。

> 编译安装 GCC 和 clang 非常耗费时间，得有心理准备。
