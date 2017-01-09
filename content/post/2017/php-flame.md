---

title: "php-flame"
date: 2017-09-27 12:22:37
tags:
  - php
  - c++

---

#### [https://github.com/terrywh/php-flame](https://github.com/terrywh/php-flame)
`Flame` 是一个基于协程的异步网络开发框架（PHP扩展）类似 Swoole 但相对更简单一些:

``` php
<?php
// 框架初始化
flame\init("http_server_demo");
// 第一个（主）协程
flame\go(function() {
    // 创建 HTTP 服务器（监听）
    $server = new flame\http\server(":::56101");

    $server
        ->before(function($req, $res) { // 前置处理器（HOOK）
            $req->data["before"] = flame\time\now(); // 记录请求开始时间
        })
        ->get("/hello", function($req, $res) { // 路径处理器
            // 简单响应方式
            $res->status = 200;
            $res->body = "world";
        })
        ->post("/hello/world", function($req, $res) { // 路径处理器
            // Transfer-Encoding: Chunked
            $res->write_header(200);
            $res->write("CHUNKED RESPONSE:")
            $res->write($res->body);
            $res->end();
        })
        ->after(function($req, $res, $r) {
            // 后置处理器（HOOK）
            flame\log\trace($req->method, $req->path // 请求时长日志记录
                , "in", (flame\time\now() - $req->data["before"]), "ms");
            if(!$r) {
                $res->status = 404;
                $res->file(__DIR__."/404.html"); // 响应文件
            }
        });
    $server->run();
});
// 启动（调度）
flame\run();
```
