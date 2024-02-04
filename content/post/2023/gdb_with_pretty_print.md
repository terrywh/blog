+++

title = "GDB 启用 PrettyPrint 支持"
date = "2023-11-15"
tags = ["c++", "gcc", "gdb", "pretty print"]
cover = "/images/default-cover.png"
categories = "笔记"

+++

> 启用 Pretty Print 可方便在基于 GDB 的调试能够更直观的查看标准库内的结构，如字符串、向量、列表等；
> 一般系统默认的 GCC/G++ 安装已能正常工作；在升级安装多个 GCC 版本时，可参考如下流程配置：

* 安装 GCC/LLVM 请参考 [新版本 GCC/LLVM 安装](/post/2023/compiler_setup/)

* 依赖组件（依赖 python 支持支持 PrettyPrint 功能）
``` bash
yum install -y python3-devel gmp-devel
```


* 下载 GDB 编译安装：
``` bash
wget https://sourceware.org/pub/gdb/releases/gdb-13.2.tar.xz
tar xf gdb-13.2.tar.xz
cd gdb-13.2
mkdir stage
cd stage
CC=/data/server/compiler/bin/gcc CXX=/data/server/compiler/bin/g++ ../configure --prefix=/data/server/compiler --with-python=/usr/bin/python3
make -j4
make install
```


* 启用 Pretty Print 支持
编辑 ~/.gdbinit 文件并填写下述内容：
``` python {filename="~/.gdbinit"}
python
import sys
sys.path.insert(0, '/data/server/compiler/share/gcc-13/python')
end
source /data/server/compiler/lib64/libstdc++.so.6.0.32-gdb.py
```
