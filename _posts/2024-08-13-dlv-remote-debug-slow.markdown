---

title: "远程 dlv 调试缓慢问题"
date: 2024-08-13
tags:
  - delve
  - dlv
  - go
  - debug
  - remote
categories: post

---
* 在双方机器安装调试工具
``` bash
go install github.com/go-delve/delve/cmd/dlv@latest
```
* 配置环境变量：
``` bash
export PATH=$PATH:$GOPATH/bin
```
* 在远程机器启动对应服务：
``` bash
dlv --listen :33333 --api-version=2 --headless --accept-multiclient --allow-non-terminal-interactive exec {program-to-run} -- {program-args}
```
* 在 vscode 中进行类似配置进行远程调试：
``` JSON
{
    "version": "0.2.0", 
    "configurations": [
        {
            "name": "remote-debug",
            "type": "go",
            "request": "attach",
            "mode": "remote",
            "host": "{address-to-remote-server}",
            "port": 33333,
            # 加入适配器配置，否则可能导致调试极其缓慢的问题
            # 参见：https://github.com/golang/vscode-go/releases/tag/v0.41.3
            "debugAdapter": "dlv-dap", 
        }
    ]
}
```
