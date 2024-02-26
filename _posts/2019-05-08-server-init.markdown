---

title: "Server Initialization"
date: 2019-05-08
categories: post
tags:
  - c++
  - shell

---

# {{page.title}}

#### BASIC
``` bash
apt update
apt upgrade
apt install aria2 build-essential cmake libpcre3-dev libssl-dev zlib1g-dev
mkdir -p /data/server/v2ray
```

#### BBR
``` bash
# 验证
lsmod | grep bbr
# 挂载
modprobe tcp_bbr
echo "tcp_bbr" >> /etc/modules-load.d/modules.conf
# 启用
echo "net.core.default_qdisc=fq" >> /etc/sysctl.conf
echo "net.ipv4.tcp_congestion_control=bbr" >> /etc/sysctl.conf
# 生效
sysctl -p
```

#### NGINX
``` bash
cd ~
wget http://nginx.org/download/nginx-1.15.12.tar.gz
tar xf nginx-1.15.12.tar.gz
cd nginx-1.15.12
./configure --with-http_ssl_module --without-select_module --with-http_v2_module --with-http_gzip_static_module --prefix=/data/server/nginx
make -j2
make install
```

#### V2RAY
``` bash
cd ~
wget https://github.com/v2ray/v2ray-core/releases/download/v4.18.1/v2ray-linux-64.zip
cd /data/server/v2ray
unzip ~/v2ray-linux-64.zip
```

#### Certificate
``` bash
mkdir -p /etc/letsencrypt/live/
scp -r root@source_host:/etc/letsencrypt/live/terrywh.net /etc/letsencrypt/live/
certbot certonly -d "*.terrywh.net" --manual --preferred-challenges dns
certbot renew
```

#### START
``` bash
/data/server/nginx/sbin/nginx
aria2c --conf-path=/data/htdocs/downloads.terrywh.net/etc/aria2.conf
/data/server/v2ray/v2ray --config /data/server/v2ray/config.json &>/dev/null &
```

#### GCC
``` bash
# 下载安装新版本
wget http://ftp.tsukuba.wide.ad.jp/software/gcc/releases/gcc-9.1.0/gcc-9.1.0.tar.xz
tar xf gcc-9.1.0.tar.xz
cd gcc-9.1.0
./contrib/download_prerequisites
mkdir stage && cd stage
# 下面命令行可参考当前已安装的 gcc -v 的配置
../configure --enable-languages=c,c++ --prefix=/data/server/gcc-9.1.0 --enable-shared --enable-linker-build-id --without-included-gettext --enable-threads=posix --enable-nls --with-sysroot=/ --enable-clocale=gnu --enable-libstdcxx-debug --enable-libstdcxx-time=yes --with-default-libstdcxx-abi=new --enable-gnu-unique-object --disable-vtable-verify --enable-libmpx --enable-plugin --enable-default-pie --with-system-zlib --with-target-system-zlib --enable-objc-gc=auto --disable-werror --with-abi=m64 --disable-multilib --with-tune=generic --enable-offload-targets=nvptx-none --without-cuda-driver --enable-checking=release --build=x86_64-linux-gnu --host=x86_64-linux-gnu --target=x86_64-linux-gnu
make -j8
sudo make install
# 注意：配置 ldconfig 方便找到新版本 C/C++ 库；否则可能导致使用新版本编译的应用无法启动；
```

#### CLANG (LLVM)
``` bash
wget https://github.com/llvm/llvm-project/archive/llvmorg-8.0.1.tar.gz
tar xf llvmorg-8.0.0.tar.gz
cd llvm-project-llvmorg-8.0.1
mkdir stage && cd stage
# 这里使用了上面已编译安装的 gcc 一定优先配置 ldconfig 否则可能在编译链接测试流程出错
CC=gcc CXX=g++ LDFLAGS="-L/data/server/gcc-9.1.0/lib64" cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/data/server/llvm-8.0.1 -DGCC_INSTALL_PREFIX=/data/server/gcc-9.1.0 -DLLVM_TARGETS_TO_BUILD="X86" -DLLVM_ENABLE_PROJECTS="clang;clang-tools-extra;compiler-rt;lld;openmp;polly" ../llvm
make -j8
sudo make install
```

#### GDB (pretty print)
``` bash
python
import sys
sys.path.insert(0, '/data/server/gcc-10.2/share/gcc-10.2.0/python')
end

source /data/server/gcc-10.2/lib64/libstdc++.so.6.0.28-gdb.py
```
