+++
title =  "打洞（P2P）与 NAT 类型"
date = 2025-05-06
tags = ['network','p2p']

+++

之前一直有大致了解这里，无意发现一篇文章总结的比较到位，尤其是这个图：

![NAT](https://support.dh2i.com/assets/images/nat_types-81eca38551a438b10ae1bb6c16ba1aee.png)

原文地址：
https://support.dh2i.com/docs/Archive/kbs/general/understanding-different-nat-types-and-hole-punching/

以下使用 [bun](https://bun.sh) 脚本提供服务端、客户端实现一个简单的 P2P 通讯：

* [hole-punching-server.js](./hole-punching-server.js)
* [hole-punching-client.js](./hole-punching-client.js)

``` bash
# 服务端（需要公网地址,提供简单的地址发现）
bun run hole-punching-server.js --port={port=61002}

# 客户端1（内网）
bun run hole-punching-client.js --name={client_id_1} --server={server_address:port=61002}

# 客户端2（内网，尝试连接到客户端1）
bun run hole-punching-client.js --name={client_id_2} --server={server_address:port=61002}

connect to: client_id_1
```