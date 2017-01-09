---

title: "Server Initialization"
date: 2019-05-08
tags:
  - c++
  - shell

---

> 更新：2024-03-26

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
wget http://nginx.org/download/nginx-1.25.4.tar.gz
tar xf nginx-1.25.4.tar.gz
cd nginx-1.25.4
./configure --with-http_ssl_module --without-select_module --with-http_v2_module --with-http_gzip_static_module --prefix=/data/server/nginx
make -j2
make install
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
安装新版本 GCC/LLVM 请参考 [新版本 GCC/LLVM 安装]({% link _notes/compiler-setup.md %})

#### CLANG (LLVM)
安装新版本 GCC/LLVM 请参考 [新版本 GCC/LLVM 安装]({% link _notes/compiler-setup.md %})

#### GDB (pretty print)
安装新版本 GDB 及配置 PrettyPrint 请参考 [GDB 安装并 PrettyPrint 支持]({% link _notes/gdb-with-pretty-print.md %})

#### HELIX
> https://github.com/helix-editor/helix/releases
``` bash
# ~/.config/helix/config.toml
theme = "onedark"
[editor]
true-color = true
mouse = false
```