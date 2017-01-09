---

title: "Atom 插件 go-plus 配置 GOROOT"
date: "2017-08-01"
tags: 
  - go
  - editor

---

由于需要在同一台机器部署两种 GO 环境(WSL + Win)，这里对 go-plus 代码进行一点点修改，加入 goroot 配置参数来解决这个问题：

``` javascript
// ~/.atom/packages/go-plus/lib/config/environment.js
// ...
// const getenvironment = (): {[string]: ?string} => {
// ...
  if (!e.GOROOT) {
    let r = atom.config.get("go-plus.config.goroot")
	if (r && r.trim() !== '') {
		e.GOROOT = r
	}
  }
//  e.GINKGO_EDITOR_INTEGRATION = 'true'
//  return e
// }
```
即通过配置参数 `go-plus.config.goroot` 模拟环境变量。
