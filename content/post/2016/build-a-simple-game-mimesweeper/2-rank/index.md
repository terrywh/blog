---

title: "扫雷（二）排行榜（定义和使用函数、对象）"
date: 2016-06-20
tags:
  - css
  - javascript
thumbnail: "/post/2016/build-a-simple-game-mimesweeper/cover.png"
params:
  demo: "/post/2016/build-a-simple-game-mimesweeper/5-demo.html"
  series:
  - "build-a-simple-game-mimesweeper"
  
---

　　**第一章**我们实现了最基本的游戏界面和游戏的简单入口，这一章，我们完善和制作 排行榜 功能，并为将来游戏结束时使用、记录排行榜提供支持。

　　在使用 互联网 的时候，我们基本上离不开**浏览器** (`browser`) 。 浏览器其实可以看作一个 中间人，他将 用户无法理解、看不太懂的 脚本语言描述的程序，转换为 用户可以看得到的界面、接收用户的输入输出动作，并通过执行脚本程序给出对应的反馈。 一般，我们把前面的 “转换为界面” 过程称作 “渲染” (render)。 在[上一章][chapter-1]中，我们在 `.html` 文件中填写了代码，在浏览器中打开这个文件，看到了界面，我们姑且称这个“渲染”动作为“静态渲染”，那么这一章中，我们将会看到另外一种“动态渲染”。

> **接口** 可以理解为能够让另外的代码、模块调用的函数、对象；  
> **分装** 即就是将可以重复使用或功能联系紧密的若干代码聚合在一个可以被 调用 或 访问的模块中；

在程序开发过程当中，我们一般会提到“接口”，“封装”等等概念。我理解，提出这些概念的目的，其实是在告诉我们，将程序写的更“清晰”一些。这个“清晰”一般可以描述为两方面：

1. 功能完整 - 实现某个功能应该做些什么事情？如果要做这个事情，是不是可以有不同的做法？
2. 分工明确 - 某个功能应该在哪里做？代码写在哪里？

定义“接口”，即就是将完整的、能够重复使用的“功能”包装（封装）成函数、对象，并供其他逻辑 或 在其他地方调用；使用者并不需要了解“接口”内部具体的实现逻辑，只需知道接口“形式”即可使用，完成对应的功能，同时使用者 **不需要对其不需了解的事情加以干涉**。我们下面也会封装、实现一些简单的接口来介绍上面的概念。

#### 排行榜的结构
按照网页的开发方式，我一般习惯按照“基本结构”->“外观润色”->“行为功能”这个流程进行进行开发。首先，在排行榜（[上一章][chapter-1]中 `(3)` 的位置）加入下面“基本结构”的 `HTML` 代码：
``` html
<!-- 标题，可以使用 h1 ~ h5，大小、颜色稍有不同 -->
<h4>排行榜</h4>
<!-- table-striped 将会让表格内容变成深浅相间的行 -->
<table class="table table-striped">
	<!-- 表头 -->
	<thead class="thead-default">
		<tr>
			<th>#</th>
			<th>姓名</th>
			<th>用时</th>
		</tr>
	</thead>
	<tbody id="rank_table">
		<!-- 表格内容 -->
	</tbody>
</table>
```

> 在 HTML 中描述一个表格，使用 `<table>` 标签，并用 `<tr></tr>` 来表示一行，`<th></th>` 或 `<td></td>`  分别来表达 表头和表体 中的单元格。  
> 上面元素对应的属性 `class` 中使用的对应内容，可暂不关心（有兴趣的同学，可以 参看 [中文](http://v3.bootcss.com/css/#tables) 或 [英文](http://getbootstrap.com/css/#tables) 的文档）

上述代码我们建立了一个基本的“表”，并为表体元素起名为 `rank_table` 便于将来对其进行操作（如，加入实际展示的数据，刷新排行榜等）。  

因为我们对上层 `<div class="block">` 元素设置了 `text-align: center` 居中对齐，表格对齐（标题被设置为左对齐了，内容区域是居中对齐的）有点乱，需要加入下面 CSS 样式（`minesweeper.css` 文件中）：

``` css
.block.rank .table tbody td { /* 排行榜表格内容居左(由于上层元素设置了 居中) */
	text-align: left;  /* left - 左对齐 right - 右对齐 center - 居中 */
}
```

> CSS 中存在样式的“继承”，即父级元素设置的样式，如果适用的化，会被“继承”应用的子元素上。  
> 所谓适用的样式有很多，例如 字体名 `font-family` 、字体大小 `font-size` 、颜色 `color`，当然也存在一些特殊情况，这些属性不会被继承，例如：  
> `<div style="color: red;"><a href="#">这个 A 标签的颜色不继承</a></div>`

#### 动态渲染

编写 `minesweeper-rank.js` 文件，我们使用 `JavaScript` 程序为表格加入内容，并“**渲染**”出来：

``` js
(function($) {
	// 位置：(A)
	var data = [
		{name:"DemoUserA", time:200}, // 直接使用 XXX 秒 来描述 耗时
		{name:"DemoUserB", time:300}, // 展示的时候用程序将其变为 XX 分 XX 秒的形式
		{name:"DemoUserC", time:400},
	]
	// 我们定义 $ 开头的变脸用来记录要操作的元素
	var $table = $("#rank_table")
	// 排行榜的 “渲染”
	function render() {
		$table.empty() // 清空表格中目前的内容
		for(var i=0;i<data.length;++i) { // 循环数组，依次生成每一行 tr 的各个单元格 td
			// i+1 按数值形式计算，如果不加括号先和前面文本进行“连接”，不符合预期
			$table.append("<tr><td>"+(i+1)+"</td><td>"+data[i].name // 一行太长，可以换行写
				+"</td><td>"+renderTime(data[i].time) // this 这里指得就是当前 排行榜对象 rank
				// 调用 renderTime 函数生成 XX分XX秒 形式的文本
				+"</td></tr>")
			// ！ 加入内容，其实就是将 HTML 代码文本 `append()` 添加到表格体中
		}
	}
	// XXX 秒 => XX 分 XX 秒
	function renderTime(time) {
		return parseInt(time/60) + " 分 " + (time % 60) + " 秒"
	}
	// 刷新页面时立刻进行“渲染”
	rank.render()
	// 位置：(B)
}(jQuery))
```

> JavaScript 中可以使用 `[ ... ]` 形式定义数组，使用 `{XXX: YYYY, XXX: YYYY}` 形式定义对象；  
> 数组一般使用 下标形式访问，例如 `data[i]`；  
> 对象一般使用 .name 形式访问，例如 `data[i]` 是一个对象，可以用 `data[i].name` 来访问其姓名属性；


#### 持久化

为了让排行榜能够记录并保留数据（不在刷新后消失），我们参照 [第一章](chapter-1) 使用 `localStorage` 对象提供的功能来完成。我们将 `(A)` 处初始化的代码改为：

``` js
// 位置： (A)
var data = localStorage.getItem("rank_data")
if(!data) {
	data = [ // 为演示方便，我们初始化一些数据
		{name:"DemoUserA",time:200}, // 我们直接使用 XXX 秒 来描述用时
		{name:"DemoUserB",time:300}, // 我们直接使用 XXX 秒 来描述用时
		{name:"DemoUserC",time:400}, // 我们直接使用 XXX 秒 来描述用时
	]
	// 我们不能直接包数组数据保存到 localStorage 中，需要对他进行“序列化”，即将起变成文本；
	localStorage.setItem( "rank_data", JSON.stringify(data) )
	// 在 JavaScript 中一般使用 JSON.stringify(obj) 将 obj 变为文本形式以便存储
	// 这种“变文本”的过程就是“序列化”
}else{ // 保存了数据，读取出来后需要“还原”：
	// 由于我们保存的是“序列化”的数据，我们需要将它“反序列化”
	data = JSON.parse(data)
	// JSON.parse() 与 上面 JSON.stringify() 对应，用于还原已经“序列化”的文本到其原始值
}
```

> `JSON` 与 `localStorage` 类似，也是由浏览器提供的进行数据“序列化”、“反序列化”的函数对象。 同时 `JSON` 也是一种文本描述数据的形式，具体说明可以参考 [http://www.json.org/json-zh.html](http://www.json.org/json-zh.html)；  
> 同时 `JSON` 是目前最流行的数据交换方式的一种，尤其在服务器端与浏览器交互的“数据型接口”中被大量应用。例如大家熟知的 微信公众平台，就提供了 `JSON` 形式的接口，有兴趣的同学可以看看他们的文档 [https://mp.weixin.qq.com/wiki](https://mp.weixin.qq.com/wiki)；

我们可以在浏览器中打开网页，并按 <kbd>F12</kbd> 键打开调试界面，在 `Resource` 面板中，找到 `localStorage` 项，可以看到我们的程序已经将数据成功的写入了：

![排行榜成功存储](2-rank-f12.png)

大家可以尝试通过这个面板修改 localStorage 的内容，刷新页面后会发现展示的内容也会随之发生变化。

#### 接口

到这里，我们为排行榜定义的界面和基本显示功能就完成了。但是，这个排行榜还没有办法**动态的调整**，即将来在实际游戏完成的时候，我们需要把当前名称的用户成绩“更新”或“加入”到排行榜里面。虽然是将来，我们需要先为游戏结束做进行这个功能时留下接口。

我们可能需要提供很多这些类似的“接口”，我们把这种接口统一放在一个名为 `MineSweeperRank` 的全局对象中（在位置 `(B)` 处加入下面的代码）：

``` js
// 位置：(B)
window.MineSweeperRank = { // window 为全局命名空间，同时也代表了浏览器当前打开网页的窗口
	// 接口1. 加入用户及成绩进入榜单
	appendUserRank: function(name, time) {
		// 将成绩插入到 data 中的合适位置
		// 从后往前，找到用时小于当前 time 的地方
		for(var i=data.length-1; i>=0; --i) {
			if(data[i].time < time) {
				data.splice(i + 1, 0, {"name": name, "time": time}) // 从 i + 1 这个位置开始，删除 0 个元素，加入 新增元素
				break // 找到了速度更快的记录，跳出循环（这时 i 应该还小于 data.length）
			}
		}
		if(i == data.length) { // 没有找到比当前值更小的了，直接排在第一名
			data.unshift({"name": name, "time": time})
		}
		// 截取 data 的前 6 项（不要让排行榜太长了）
		data = data.slice(0, 6)
		// 数据更新了，我们需要对应更新界面，即重新渲染
		render()
		// 保存数据
		localStorage.setItem( "rank_data", JSON.stringify(data) )
	},
	// 接口2. 清理(清空)榜单
	clearRank: function() {
		data.splice(0, data.length)
		// 数据更新了，我们需要对应更新界面，即重新渲染
		render()
		// 保存数据
		localStorage.setItem( "rank_data", JSON.stringify(data) )
	},
	// 接口3.
}
```

上面函数目前没有实际的调用者，我们可以在 "开发者工具" (<kbd>F12</kbd>) 的 `Console` 界面中输入调用代码（例如：`MineSweeperRank.appendUserRank("Terry",450)`） 尝试调用，看看效果：

![尝试调用接口](2-rank-api.png)

从分工明确的角度，我们也给 “入口” 增加 “接口” 功能，我们将 “获取用户输入的名字” 和 “开始游戏” 作为 “接口” 封装。 注意，前者与上述 排行榜 接口 类似，是“调用”方式的接口。而后者，则是“**触发**”形式的接口。

我们先将“调用”形式的接口实现（调整 `minesweeper-entry.js` 文件, 在结束行函数大括号内，补充如下代码）：

``` js
// 位置 (C)
// 对外接口
window.MineSweeperEntry = {
	// 接口1. 获取当前用户名
	getName: function() {
		return localStorage.getItem("entry_input_name") || "无名氏"
	},

}
// 位置 (D)
```

> JavaScript 使用 `||` 表示 “逻辑或”，但与其他部分语言不同，`||` 返回的并非是 “布尔值”，而是条件中 第一个**真**值；  
> 对应的还存在 `&&` 标识 “逻辑与”，也同样存在上面的使用方式，返回第一个**假**值，例如：`var a = true && 0` 变量 <var>a</var> 的值为 `0` 而非 false；

从分工上说，我们将 获取姓名 接口定义在 “入口”，从 职责上说 我们将 “未输入姓名，处理为 ‘无名氏’” 这个逻辑封装在了接口内部，使用者就不用关心了。

请大家尝试使用 Chrome 浏览器提供的**开发者工具**（<kbd>F12</kbd> 或菜单 <kbd>三</kbd> -> <kbd>更多工具</kbd> -> <kbd>开发者工具</kbd>）。它能够提供界面元素 (HTML/CSS) 的调试、 代码（JavaScript）调试，页面性能测试，网络监控等等功能，甚至很多功能连一些正式的前端开发人员都不太了解。有兴趣的同学可以去看看 [http://devtoolstips.com/](http://devtoolstips.com/)，这个网站总结和演示了很多开发者工具的使用技巧，值得学习。

#### 完整版本演示

[demo]({{< param demo >}})