---

title: "Flatpak 安装 Fcitx5 输入漏字母问题"
date: 2024-06-12
tags:
  - fcitx5
  - rime
categories: post

---

> 安装 flatpak 对应包 fcitx5 及相关 optional addon 如 fcitx5-rime 后，按教程配置对应环境变量：
> 推荐配置在 /etc/environment 中：
```
# /etc/environment
LANG="zh_CN.UTF-8"
QT_IM_MODULE=fcitx
GTK_IM_MODULE=fcitx
XMODIFERS="@im=fcitx"
```
上述过程后还出了奇怪的输入漏字母问题（尤其在 CHROME/VSCODE 中）；后几经查证，由于输入发对应应用需要加载 fcitx5-frontend-* 相关插件才能正确完成输入发功能；但对应组件需要与对应应用处于同环境，而无法通过 flatpak 安装（隔离的运行环境）故：
``` bash
apt install fcitx-frontend-*
```
解决了问题；
参考：
* [github.com/fcitx/fcitx5](https://github.com/fcitx/fcitx5/issues/108)