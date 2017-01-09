---

title: "扫雷（三）雷区（元素定位、事件代理、背景图片）"
date: 2016-06-30
tags:
  - css
  - javascript
thumbnail: "/post/2016/build-a-simple-game-mimesweeper/cover.png"
params:
  demo: "/post/2016/build-a-simple-game-mimesweeper/5-demo.html"
  series:
  - "build-a-simple-game-mimesweeper"
---

经过 **第一章** 和 **第二章** 我们已经将整个游戏的 “开头”（输入姓名、开始游戏）和 “结尾”（排行榜）做好了，今天我们来绘制雷区。  
在绘制雷区时我们会使用上一章提到的 “动态绘制”，还会用到与第一章类似的一些样式来将我们的雷区绘制的更贴近于 Windows 的扫雷的效果。

### 绘制雷区（元素定位）

我们为了简单的实现雷区，我们把每个雷区的格子定义为三个元素，一个是最外层的 “格子”，一个是用于挡住格子的 “遮罩”，以及一个方便显示 数字的 “容器”。  
每个格子需要绘制出四周的虚线，遮罩需要能够挡住格子中的内容，我们将针对格子和遮罩做出两个 css 的 样式 类（`class`），定义出上述元素的外观（将下面代码加入 `minesweeper.css` 文件中）：

``` css
.field {
	width: 576px; /* 24 * 24 的雷区，每个格子 24px */
	height: 576px; /* 所以雷区是 480 * 480 px */

	background: #dddddd; /* 将雷区的北京设为灰色 */
	margin: 0 auto; /* 让雷区显示在 .block.main 元素的中间位置 */
	border-bottom: 1px dashed #aaaaaa; /* 参考 .field .cell 的说明 */
	border-right: 1px dashed #aaaaaa; /* 参考 .field .cell 的说明 */
	/* 使得 .field 内部的 .cell 元素参照定位 */
	position: relative;
}

.field .cell {
	position: absolute; /* 参照上层最近的 position: relative / absolute 的元素进行绝对定位 */
	/* 我们给格子画上虚线边框。注意边框实际不是所有的边框，右边框实际是下一个格子的左边框 */
	/* 用外层的 .field 元素将最后的右边框、下边框补齐 */
	border-top: 1px dashed #aaa; /* #aaaaaa 可以缩写成 #aaa */
	border-left: 1px dashed #aaa;
	width: 24px;
	height: 24px;
	/* 为了让将来在格子中出现的 数字 或 地雷能够居中 */
	font-size: 12px;
	line-height: 24px; /* 文字的行高 与 实际元素高度一致，刚好做到文字居中 */
}

.field .mask {
	position: absolute; /* 与上面 cell 类似，使的 mask 能够参照 .cell 定位 */
	top: 0;
	left: 0;
	width: 100%; /* 将其沾满 */
	height: 100%;
	/* 为了让遮罩层呈现“凸起”的效果，边框进行一定的颜色定义 */
	border-top: 2px solid #fcfcfc; /* 上、左 边框高亮 */
	border-left: 2px solid #fcfcfc;
	border-right: 2px solid #ccc; /* 下、右边框加深 */
	border-bottom: 2px solid #ccc;
	background: #ddd;
}

```


注意到 我们将 `.field` 元素居中使用了 `margin: 0 auto;` 这个的样式代码，其含义可以理解为元素外上下留白为 0，而左右留白为 **自动**。 它和我们之前“文字居中”，使用的 `text-align: center;` 类似，但可以应用到“块级元素”。 这个概念大家可以通过 [MDN - Block-level_elements](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Block-level_elements) 查看相关说明，以及和类似的“行内元素”等概念的区别。

下面，我们使用代码动态的创建雷区、格子等 `HTML` 元素（建立 `minesweeper-field.js` 文件，并将下面代码加入）：

``` js
(function($) {
	var $field = $("<div class=\"field\"></div>").appendTo(".block.main"); // 创建一个 div 元素用来容纳雷区，并将其加入之前页面中
	// 我们暂时将雷区定义为 24 * 24 个格子，大家可以尝试调整为其他数值
	// 每个格子定义为 24 * 24 大小
	var cells = {}, // 用于记录每个格子元素
		nums  = {}; // 用于记录每个格子中的数字
		// 如果对应格子不存在标记的数字，默认是 0（周围没有地雷）
		// 如果对应的格子中是地雷，在 nums[x:y] 标记 -1
	for(var x=0;x<24;++x) {
		for(var y=0;y<24;++y) {
			// 使用绝对定位，根据 x y 计算出每个格子的位置；
			cells[x+":"+y] = $("<div class=\"cell\" style=\"left: "+(x*24)+"px; top: "+(y*24)+"px;\">" +
				"<div class=\"mask\"></div>" +
				"<span></span>" +
				"</div>")
					.appendTo($field)
					.data("x", x) // 将 x 坐标保存在元素中，后面会用到
					.data("y", y);
			// 我们将每个格子的元素保存在 “x:y” 这个一个名称中，方便将来访问对应的元素
			// 当然也可以使用二位数组实现类似 cells[x][y] 这种方式，大家可以尝试
			nums[x+":"+y] = 0; // 暂时格子都没有地雷
		}
	}
	// 位置 (A)
}(jQuery))

```

大家可以尝试在浏览器<kbd>F5</kbd>刷新网页，看看我们绘制出来的 “雷区” 是个什么样子。

#### “扫雷”（事件代理）

“扫雷”最基本的行为就是“打开一个格子看看下面是什么”，下面我们就给雷区加上一个基本的“扫雷”行为。即点击指定的格子，将上面遮罩的层隐藏，从而展示出格子中的内容（将下面的代码加到上述 `(A)` 位置 ）：

``` js
$field.on("click", ".cell", function(e) { // 左键点击的处理
	openCell($(this)); // 打开格子的逻辑，在下面 openCell() 函数中处理
})

function openCell($cell) {
	// 我们暂时直接打开当前格子
	$cell.find(".mask").hide() // 隐藏遮罩层
	// 下一章的章节我们会继续处理连续空格打开的功能
}
```
这里我暂时没有处理“连续空格”自动打开的问题，大家可以先尝试运行（<kbd>F5</kbd>刷新网页），看看效果，我们会在下一章继续对这里进行调整和完善：

![雷区绘制和点击效果](3-field-mask.png)

比较[第一章][chapter-1]中我们对“开始游戏”按钮点击的处理，这里有一点区别。我们没有直接将事件“绑定”在被点击的元素上而是绑定了在其“父级”元素上。这样做是因为被监听的元素是后来动态创建的，而且数量较多。一个一个去对它们做绑定事件，过于繁琐。所以，这里使用“父级元素” `.field` 代理了子元素 `.mask` 的点击事件，来简化处理。

注意，我们使用 `$cell` 获取到了当前的格子元素，其实还可以通过获取我们保存在该元素属性 `data-x` / `data-y` 的下标 配合 `cells` 来获取和访问其他元素，例如：

``` js
// 获取当前元素的下标
var x = $cell.data("x"), y = $cell.data("y");
// 左上角的元素
cells[(x-1) + ":" + (y-1)]
```

> `.data()` 函数被用来读取或保存在元素上的数据：  
> `.data("key")` 读取 `data-key` 属性的数据；
> `.data("key","val")` 将 `val` 保存到 `data-key` 属性中


#### 插旗子（背景图片）

下面我们给 **点击右键** 加上实际的效果：插上旗子。

由于用程序绘制“旗子”稍显复杂，这里我们直接使用图片来代替:

![旗子和地雷](/post/2016/build-a-simple-game-mimesweeper/sprite.png)

我们在 `css` 代码中补充两个样式，分别为 `.mask` 元素（遮罩层） 和 `.cell` 元素（雷区的格子）增加插上旗子和有地雷的效果：


``` css

.field .mask.flag { /* mask 元素上面展示旗子, 即如果一个元素同时具有 mask 和 flag 两个 class */
	background: #ddd 0px 0px url(./sprite.png); /* 插上旗子即就是在背景上显示图片 */
	/* 0px 0px 是指将背景图在元素上的位置 */
}

.field .cell.bomb { /* 在某个格子中显示地雷 */
	background: #ddd -24px 0px url(./sprite.png);
	/* -24px 即就是使背景图左偏移24像素，刚好显示出了地雷的部分 */
}

```

> 在 css 中引用图片，一般使用 `url(文件路径)` 这种形式  
> 在 网页开发过程中文件路径我们一般会使用 “相对” 路径，即参照 “当前网页” 目标文件的路径；并且使用 “/” 作为路径分隔符；  
> 如果 网页 在服务器运行，我们也会采用 “绝对” 路径，即 从网站“根目录”算起的目标文件路径；  
> 有兴趣的同学可以看看 [What is a Url][https://developer.mozilla.org/zh-CN/Learn/Common_questions/What_is_a_URL]；

调整上面处理点击的代码，改为：

``` js
$field.on("click", ".cell", function(e) { // 左键点击的处理
	openCell($(this)); // 打开当前格子
}).on("contextmenu", ".cell", function(e) { // 右键点击的处理
	e.preventDefault(); // 防止浏览器弹出自身的上下文菜单
	// 插上旗子
	flagCell($cell); // 为当前被右键点击的mask元素加上或去掉 flag 定义的样式
})
function openCell($cell) {
	// 我们暂时直接打开当前格子
	$cell.find(".mask").hide() // 隐藏遮罩层
	// 后面的章节我们会继续处理连续空格打开的功能
}
function flagCell($cell) {
	$cell.find(".mask").toggleClass("flag");
}
// 为方便测试，我们在格子里“显示”两颗地雷：
cells["2:2"].addClass("bomb");
cells["2:3"].addClass("bomb");
```

> toggleClass() 函数可以为指定的元素添加或删除指定的 class 样式（取决于当前是否有指定的 class，若有则删除，否则加上。）
> addClass() 即添加指定的 class 样式
> 对应的还有 removeClass() 即删除指定的 class 样式

尝试左键和右键点击雷区，看看我们扫雷的成果：

![插旗和地雷](3-field-flag-bomb.png)

#### 布雷

扫雷游戏中，应该先进行“布雷”，然后“扫雷”，所以我们在这里为主程序提供**布雷接口**，即在指定坐标的格子中，放置一颗地雷这一功能。同时，扫雷游戏需要我们在地雷的周围标记相应的 数字。实现这个接口，我们将 **更新地雷周围的数字** 这个逻辑**封装**在 布雷 这个**接口**中。这样，主程序就不必再关心“布雷”时“更新数字”的问题了。

把上面测试用布雷的代码替换为：

``` js
// 使指定的格子中的提示数字加 1
function incrCell(x, y) {
	// ? : 是 三元运算符，请参看下文说明
	var n = nums[x+":"+y] ? nums[x+":"+y] : 0; // 当 numbs[x+":"+y] 对应的元素不存在时，获取 0 值
	if(n > 0) { // 已经大于 0 了，加一颗雷
		n = n + 1;
	}else if(n == 0) { // 现在还是 0 给变成 1
		n = 1;
	}else{ // -1 表示这个格子是地雷
		// 有地雷的格子就不用动了
	}
	nums[x+":"+y] = n
	if(n>0) {// 在 span 元素中显示对应的数字
		cells[x+":"+y].find("span").text(nums[x+":"+y])
	}
}
// 接口
window.MineSweeperField = {
	// 清理已经布置的地雷，重置雷区
	reset: function() {
		for(var key in cells) {
			// 移除地雷
			cells[key].removeClass("bomb");
			// 显示遮罩
			cells[key].find(".mask").show();
			// 清除各自中的数字
			cells[key].find("span").text("");
			// 所有标记清除
			nums[key] = 0;
		}
	},
	// 主程序调用接口布置地雷
	putBomb: function(x,y) {
		if(nums[x+":"+y] == -1) return; // 该格子里已经有地雷了
		// 元素展示效果
		cells[x+":"+y].addClass("bomb")
		// 用 -1 来表达地雷
		nums[x+":"+y] = -1;
		// 这个格子加上了地雷，我们需要对它周围的格子标记提示的数字进行更新
		incrCell(x-1,y-1); // 左上
		incrCell(x,  y-1); // 上
		incrCell(x+1,y-1); // 右上
		incrCell(x-1,y  ); // 左
		incrCell(x+1,y  ); // 右
		incrCell(x-1,y+1); // 左下
		incrCell(x  ,y+1); // 下
		incrCell(x+1,y+1); // 右下
	},
}
```

> `condition ? statement1 : statement2` 一般被成为 三元运算符，可以将其展开为 `if` 语句：  
> `if(condition) { statement1; } else { statement2; }` 即，根据条件 `condition` 是否为 **真** 然后选择执行 语句 `statement1` 或 `statement2`。

然后我们使用 <kbd>F12</kbd> 打开调试程序界面，并在 `console` 中尝试布雷，然后打开雷区看看吧：

![安放地雷的测试](3-field-bomb.png)

#### 完整版本演示

[demo]({{< param demo >}})