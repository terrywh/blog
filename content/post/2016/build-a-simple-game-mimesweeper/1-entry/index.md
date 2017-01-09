---

title: "扫雷（一）游戏入口（概念及准备）"
date: 2016-06-17
tags:
  - css
  - javascript
thumbnail: "/post/2016/build-a-simple-game-mimesweeper/cover.png"
params:
  demo: "/post/2016/build-a-simple-game-mimesweeper/5-demo.html"
  series:
  - "build-a-simple-game-mimesweeper"
---

　　记得我最开始接触编程就是父亲在“裕兴学习机”上开发了一款“扫雷”的游戏，从此开始喜欢上了计算机编程。作为纪念，也希望能给一些正在学习网页开发的同学一点点帮助，我这里也从头开始用“网页”技术开发一款“扫雷”的小游戏。

　　网页小游戏开发，顾名思义，首先我们是制作了一个网页。**网页**是互联网中与用户的交互的基本元素，并被浏览器“渲染”展示呈现给用户。从最早网页的开始，我们仅能呈现给用户“文本”，后来由于互联网的进步，我们能够支持呈献给用户“富文本”（即带有一定样式的文本，如大小不同、颜色不同等等），进而出现“多媒体”（图片、声音、视频等）甚至更多可能的交互形式（如 麦克风、摄像头、重力感应、震动等等）。在这个发展过程中，网页的开发技术逐渐定型，网页本身使用 HTML 文本进行基本界面的绘制，使用 CSS 文本描述各个元素的高级特征，如边框、偏移、位置、颜色、阴影等等，使用 JavaScript 脚本语言（文本形式，解释执行、不需要编译）进行交互、行为、功能开发。

我写的这个教程比较直接，可能会有很多没有“详细描述”的内容。刚刚入门的同学，建议去看看 [w3school](http://w3school.com.cn/) 整理的基础语言的教程和参考文档。不介意看英文的同学，可以参考 Mozilla 的开发者中心 [https://developer.mozilla.org/en-US/docs/Web](https://developer.mozilla.org/en-US/docs/Web)。 后者有一套不错的入门教程，而且他提供的参考文档是目前我看到最详细和完整的。

#### 一些准备工作

　　**首先**，我们需要准备一些用于网页开发的编辑器工具软件。在若干年前，开发网页有“三剑客”之称的三款软件即 `Dreamweaver / Flash / Firework (/Photoshop)`，分别负责 `TML/CSS/JavaScript` 、 动画、图片处理。从上面介绍的背景和我们将要进行的开发工作来看，我们只需要只涉及到 `HTML/CSS/JavaScript` **文本**形式程序的开发（对多媒体，如图片，我们仅**使用**而不对这些资源进行修改、调整），所以我们仅需要 `Dreamweaver` 这款程序。当然，这是若干年前的选择，也可以说是“低端”的选择。在我实际工作中，仅需要一款 附带语法高亮功能的**文本编辑器**就足够了。除特殊情况外，我一般使用 [SublimeText](http://www.sublimetext.com/)，附带各种强大插件的强大文本编辑器，大家可以尝试使用（程序员对编辑器的喜爱永恒是萝卜青菜的讨论，所以，**仅供参考**）。

　　**其次**，在开发调试网页的过程中，我推荐使用 `Chrome` 浏览器，相对调试方便，对相关技术标准的支持（在开发这个小游戏开发过程当中用到的技术，理论上在 IE9+ 的浏览器中都是可用的）。国内下载这款浏览器时可以去 [https://api.shuax.com/tools/getchrome](https://api.shuax.com/tools/getchrome) ，这里一般都能跟上官方更新，并且提供的是去除了国内根本不能用的更新服务的版本下载地址；

　　**最后**，需要注意一点，在整个调试过程当中，请保证您的**设备连接在互联网上**（由于直接引入了网络上一些成熟的JavaScript库 CSS 库，辅助、简化开发工作。当然这些库可以暂时不去详细学习，只需要按照教程能够看懂即可）；

![安装开发所需的工具](1-tools.png)

#### 游戏的入口
目前我们暂时不进入到实际“扫雷”的开发中，我们把入口准备一下：进入游戏时，我们让用户输入自己的姓名（将来游戏结束时记录各个用户对应的成绩）：
``` html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8" />
		<title>扫雷 - 网页小游戏</title>
		<!-- 这里引入的一个辅助库，帮助我们更好的定义网页和开发功能，可以暂不纠结具体 -->
		<link href="http://cdn.bootcss.com/bootstrap/4.0.0-alpha.2/css/bootstrap.min.css" rel="styleSheet" />
		<script src="http://cdn.bootcss.com/jquery/2.2.4/jquery.min.js"></script>
		<!-- 下面文件用来定义我们 扫雷 游戏的外观样式（见下文） -->
		<link href="./minesweeper.css" rel="styleSheet" />
	</head>
	<body>
		<div class="block entry">
			<!-- (1) 用户登记 -->
			你是谁？
		</div>
		<div class="block main">
			雷区
			<!-- (2) 游戏主界面 -->
		</div>
		<div class="block rank">
			排行榜
			<!-- (3) 游戏排行榜 -->
		</div>
		<!-- 我们的程序、逻辑、行为将在下面的 js 文件中定义 -->
		<script src="./minesweeper-entry.js"></script>
		<script src="./minesweeper-field.js"></script>
		<script src="./minesweeper-rank.js"></script>
		<script src="./minesweeper-main.js"></script>
	</body>
</html>
```
把上面的代码放在一个文本文件中，并保存在后缀 `.html` 并在浏览器中打开就能看到下面的样子：
![基本网页结构](1-page-demo.png)  
上面的代码即就是 `HTML`。使用 `HTML` 我们能够定义出网页的基本结构：
1. 最外层 `<!DOCTYPE html><html>` 和结尾处的 `</html>` 定义了一个网页的范围，也就是说，我们制作网页的内容都应该出现在这个范围之内；
2. `<head>` ... `</head>` 中描述了网页的一部分“非可视区域”或“附加”信息，例如页面的文本编码（编码概念可以暂不纠结，姑且使用 UTF-8 这种编码即可），网页标题（显示窗口标题的文字），附加的样式表（`<meta href="" .... />`）等等；
	> 按照 HTML5 标准中的描述，无内容标签（有内容标签：`<标签>内容</标签>`）不要求必须闭合例如 上面 `<meta .../>` 也可以写作 `<meta ... >`, 按照 XHTML 标准要求所有标签必须闭合。
3. `<body>` ... `</body>` 中描述网页“可视区域”的结构，我们创建了三个区块（`<div class="xxx">...</div>`），并在其内部填充了简单的文本内容；
	> 在 `HTML` 语言中使用 `<!-- -->` 来包含注释内容；
4. `class="xxxx"` 表达了我们将对指定的区块进行“样式”定义，即 `CSS`（级联样式表），我们下面就对上述三个区块，进行对应的样式（外观、位置等）定义：（将下面内容保存为 `minesweeper.css`）：
	``` css
	body { /* 对网页中的 <body></body> 所包含的内容定义“样式” */
		background: #f0f0f0; /* 定义背景颜色为淡灰色 */
		/* 颜色值为 6 位 16 进制数字，RRGGBB 即红、绿、蓝 原色，取值从 00 ~ ff */
		margin: 0; /* 区块外空隙 */
	}

	.block { /* 对网页中 class="block" 的 <div> 包含的内容定义“样式” */
		padding: 15px; /* 区块内空隙 */
		background: #fff; /* 定义背景颜色为白色 */
		border: 1px solid #556575; /* 定义 1 像素 实线 边框，颜色为蓝色 */
		text-align: center; /* 让当前元素中的文本（或类文本的元素）水平居中 */
		margin: 20px; /* 区块外空隙 */
	}
	```
> `CSS` 中，使用 `/* */` 来表达注释

为了让用户输入姓名，我们需要给用户提供一个输入框；将下面的代码替换到位置 `(1)` ：
``` html
<form class="form-inline entry">
	<fieldset class="form-group">
		<label>请输入您的姓名：</label>
		<input id="entry_input_name" type="text" class="form-control" placeholder="请输入您的姓名，以便将成绩计入排行榜！">
	</fieldset>
	<button id="entry_button_start" type="button" class="btn btn-primary">开始游戏</button>
</form>
```

上面代码为网页加入了输入框，及开始游戏用的按钮；为了后续方便我们对实际元素的操控，我们给每个元素起了一个名字（`id="xxxxxx"`）；  
我们需要再补充一点“样式”让布局更美观一些（不加入这些样式的话，输入框会和开始按钮挤在一起，大家可以自行试验）：
``` css
/* 对网页中 class 属性中同时包含 "block" "entry" 的元素 内部的
 class 属性包含 "form-inline" 的 元素 内部的
 class 属性包含 "form-group" 的元素定义样式 */
.block.entry .form-inline .form-group {
	margin-bottom: 15px; /* 含义与 margin 相同，但仅定义 元素外部 下方 空隙 */
}
```

到这里，我们目前需要呈献给用户的“界面”已经初具规模了，大家可以自行在输入框中输入文字，点击按钮看到“按下”效果：
![基本成型的网页](1-page.png)

但有个问题：用户输入的姓名会在网页刷新（<kbd>F5</kbd>）后就会消失。我们希望在用户输入后，除非自行删除或修改，应该能保持之前输入的内容，所以我们加入下面的 JavaScript 代码（`minesweeper-entry.js` 文件中）：

``` js
(function($) {
	// 使用 $("#xxxxxxx") 这种形式来访问网页中对应的 id="xxxxxxx" 的元素
	// 在输入框中发生 键盘 “抬起” keyup 或 “按下” keydown 时
	$("#entry_input_name").on("keyup keydown", function(e) {
		// 执行这段代码，保存当前输入框中的内容
		localStorage.setItem("entry_input_name", $(this).val())
		// 在这种事件处理函数内部，this 即就是当前处理的元素（"#entry_input_name"）
	})
	// 每次执行这里时，把保存的内容读取出来，并重新放回到输入框
	$("#entry_input_name").val( localStorage.getItem("entry_input_name") )
	// 第二个 $("#entry_input_name") 可以省略，让 .val 跟在前面 }) 后面
	// 因为上面的操作都是针对 #entry_input_name 这个元素
}(jQuery))
```

上面代码中，`.val()` 函数 用于获取对应输入框的内容，或设置其内容（取决于是否存在参数）；

到这里，网页刷新后，之前输入的名称就不会在消失了~

> `JavaScript` 使用 `//` 表示单行注释，`/* */` 表示多行注释；  
> `localStorage` 是浏览器提供给网页用于进行简单的 `名称 -> 数据` 形式数据存储、读取的内置对象  
> **对象**，简单来说就是可以用 . 点 来访问、调用内部属性、函数的变量；

#### 完整版本演示

[demo]({{< param demo >}})