---

title: "HTML 5 资源预处理 Hints"
date: 2016-06-21
categories: post

---
# {{page.title}}

> Hints to the browser that might prime the pump for resources you will need.  
> Preload is the only exception here, being more of an instruction than just a hint.
> **AddyOsmani** @ https://plus.google.com/+AddyOsmani/posts/7JvGGPAAuCT



> 浏览器允我们在网页的 head 中添加特定的 link 标签，提示浏览器进行资源预处理，如资源预加载、域名预解析等等。


在网页中给予浏览器以一定的提示，以加快后续资源的访问、展示效率。 “脚本预加载”较为特殊，与其说是“提示”，不如说是“指令”，它能直接指示浏览器预先加载脚本。

* DNS 预解析 ( Preresolve DNS hostnames for assets)
``` html
<link rel="dns-prefetch" href="http://my-site.com">
```

* 预连接 ( Begin a connection handshake in the background )
``` html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

* 脚本预加载 ( Declaratively fetch a resource without executing it )
``` html
<link rel="preload" href="late-script.js" as="script">
```

* 图片预加载 ( Prefetch a resource for a future navigation )
``` html
<link rel="prefetch" href="/images/large.jpg">
```

* 预渲染 ( Prerender a page in the background for future nav )
``` html
<link rel="prerender" href="next.html">
```
