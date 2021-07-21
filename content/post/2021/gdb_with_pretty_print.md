+++

title = "GDB/GCC 升级、启用 PrettyPrint 支持"
date = "2021-07-21"
tags = ["c++", "gcc", "pretty print"]
cover = "/images/default-cover.png"
categories = "笔记"

+++

> 启用 Pretty Print 可方便在基于 GDB 的调试能够更直观的查看标准库内的结构，如字符串、向量、列表等；

请参考如下步骤进行安装配置：

* 升级、安装 GCC 这里不在赘述

* 升级 GDB
``` bash
yum install python3-devel # !!!!! pretty print 依赖 python 支持
wget https://mirrors.aliyun.com/gnu/gdb/gdb-10.1.tar.gz
tar xf gdb-10.1.tar.gz
cd gdb-10.1
mkdir build
../configure --prefix={path_to_install} --with-python=/usr/bin/python3
make && make install
```

* 启用 Pretty Print 支持
编辑 ~/.gdbinit 文件并填写下述内容：
``` bash
python
import sys
sys.path.insert(0, '{path_to_gcc_share}/{gcc-version|libstdc++-{version}}/python')
end
source {path_to_gcc_lib}/libstdc++.so{version}-gdb.py # 自动启用，也可手动调用
```
