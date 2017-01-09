+++

title = "GDB 安装并 PrettyPrint 支持"
date = 2025-04-29
tags = ["gdb","shell"]
thumbnail = "https://sourceware.org/gdb/images/archer.svg"

+++

> 安装版本更新时间：2025-04-29 [gdb](https://www.sourceware.org/gdb/download/)(16.3)
> 配合 [gcc](https://gcc.gnu.org/releases.html)(15.1)

启用 Pretty Print 可方便在基于 GDB 的调试能够更直观的查看标准库内的结构，如字符串、向量、列表等；
一般系统默认的 GCC/G++ 安装已能正常工作；在升级安装多个 GCC 版本时，可参考如下流程配置：

* 安装 GCC/LLVM 请参考 [新版本 GCC/LLVM 安装](/post/2025/compiler-setup)

* 依赖组件（依赖 python 支持支持 PrettyPrint 功能）
``` bash
yum install -y python3-devel gmp-devel mpfr-devel ncurses-devel
```

* 下载 GDB 编译安装：
> 镜像列表：https://www.gnu.org/prep/ftp.html#gnu_mirror_list
``` bash
wget https://ftp.gnu.org/gnu/gdb/gdb-16.3.tar.xz
tar xf gdb-16.3.tar.xz
cd gdb-16.3
mkdir stage
cd stage
CC=/data/server/compiler/bin/gcc CXX=/data/server/compiler/bin/g++ ../configure --prefix=/data/server/compiler --with-python=/usr/bin/python3
make -j8
make install
```

* 启用 Pretty Print 支持
编辑 ~/.gdbinit 文件并填写下述内容：
``` python 
python
import sys
# 注意确认路径文件版本
sys.path.insert(0, '/data/server/compiler/share/gcc-15.1.0/python')
end
# 注意确认路径文件版本
source /data/server/compiler/lib64/libstdc++.so.6.0.34-gdb.py
```
