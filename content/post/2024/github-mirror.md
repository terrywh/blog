+++

title = "Github 腾讯镜像访问"
date =  2026-06-02
tags = ["github", "mirror"]

+++

#### 镜像
##### 页面+仓库（司内）：
    https://mirrors.tencent.com/github.com/{group}/{repo}/

参考以下示例：
* 用户：https://mirrors.tencent.com/github.com/terrywh
* 项目：https://mirrors.tencent.com/github.com/github.com/clash-verge-rev/clash-verge-rev
* 发布：https://mirrors.tencent.com/github.com/kingToolbox/WindTerm/releases

注意：
由于实际映射地址中的链接并未进行变更，会发生跳转回 github.com 或 404 not found 的情况；


##### 下载
    https://gh-proxy.com/https://github.com

参考以下示例：
* 下载：https://gh-proxy.com/https://github.com/kingToolbox/WindTerm/releases/download/2.7.0/WindTerm_2.7.0_Mac_Portable_x86_64.dmg


#### 应用
* 下载安装 bunjs 加速：
``` bash
export GITHUB=https://gh-proxy.com/https://github.com
curl -fsSL https://bun.sh/install | bash
```