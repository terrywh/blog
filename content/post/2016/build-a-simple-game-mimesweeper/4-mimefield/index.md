---

title: "扫雷（四）雷区完善（递归打开、随机布雷）"
date: 2016-07-01
thumbnail: "/post/2016/build-a-simple-game-mimesweeper/cover.png"
tags:
  - css
  - javascript
params:
  demo: "/post/2016/build-a-simple-game-mimesweeper/5-demo.html"
  series:
  - "build-a-simple-game-mimesweeper"
---

　　在 **第三章** 中我们基本完成了雷区的绘制和布雷相关接口功能，我们留下了一个未完成的功能，“一次性打开连续的空格”。在开始编写主要游戏流程前，我们先把这里完成。**

#### 打开连续的空格（递归、边界条件）

打开连续空格这个过程，大概可以描述为：

1. 如果当前要打开的格子，是空格，打开当前各自周围的其他格子。
2. 打开其他格子时，采用 1 中的逻辑。

上面这种反复使用同样逻辑，并有“逐级深入”表现的程序一般就可以称作“**递归**”。简单说，如果某个函数的功能实现中还会出现调用自身的情况，就造成了“递归”。

我们先用**递归**方式实现“打开连续空格子”这个功能（将 `minesweeper-field.js` 文件中 `openCell()` 函数调整为如下内容）：

``` js
// 打开指定的格子
function openCell($cell) {
	if(!$cell || $cell.find(".mask").prop("hidden")) { // 连续打开的停止边界条件
		return;
		// 1. 当前格子不存在（向周围寻找时超出了雷区范围）
		// 2. 遇到了已经打开的格子
	}
	// 当前格子是整个雷区的左上角，那么它的左上等元素都是不存在
	// 打开当前格子
	$cell.find(".mask").prop("hidden", true) // !!!! 隐藏遮罩层 !!!!
	// 从当前格子元素读取其坐标，便于找到周围元素
	var x = $cell.data("x"), y = $cell.data("y");
	if(nums[x+":"+y] === 0) { // 如果当前格子是空格
		// 打开当前格子周围的格子
		// 我们给打开周围格子，加入适当的延迟
		// 这样能够看到一种类似波浪的动画效果
		setTimeout(openCell, 10, cells[(x-1)+":"+(y-1)]) // 左上
		setTimeout(openCell, 20, cells[( x )+":"+(y-1)]) // 上
		setTimeout(openCell, 30, cells[(x+1)+":"+(y-1)]) // 右上
		setTimeout(openCell, 40, cells[(x-1)+":"+( y )]) // 左
		setTimeout(openCell, 50, cells[(x+1)+":"+( y )]) // 右
		setTimeout(openCell, 60, cells[(x-1)+":"+(y+1)]) // 左下
		setTimeout(openCell, 70, cells[( x )+":"+(y+1)]) // 下
		setTimeout(openCell, 80, cells[(x+1)+":"+(y+1)]) // 右下
	}
}
```

细心的各位可能又发现，我们把上一章“隐藏遮罩层”的代码由：`.hide()` 调整为 `.prop("hidden",true)`。 这里主要的目的是使用 `.prop("hidden")` 读取当前的 隐藏状态，以确定是否继续打开格子。
当然使用 `.hide()` 时也能够判断状态，对应的代码类似 `.css("display") == "none"`。 为了统一，我们也将 `reset` 接口中显示遮罩层的逻辑使用 `.prop()` 重新实现：

``` js
// 显示遮罩
// cells[key].find(".mask").show()
cells[key].find(".mask").prop("hidden", false);
```

对比 **第三章** 中对格子中数字进行调整的代码，各位可能会发现一个问题：没有边界检查！就是说，我们可能对雷区外进行了数字设置，我们得修理这个问题（修改 `incrCell()` 的代码）：

``` js
// 使指定的格子中的提示数字加 1
function incrCell(x, y) {
	// ? : 是 三元运算符，请参看下文说明
	var n = nums[x+":"+y]; // 当 numbs[x+":"+y] 对应的元素不存在时，获取 0 值
	// ++++++++++++++++++++++++++++++++++++++++++++++++++++++
	if(n === undefined) { // !!! 边界条件，x y 指示不在雷区内
		return; // 不处理
	}else if(n > 0) { // 已经大于 0 了，加一颗雷
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
```

#### 胜负判定（自定义事件、接口）

其实到这里“挖地雷”已经可以开始“挖”了，只是，不管我们如何“挖”都没有“结果”。我们希望在用户 “标记出所有地雷” 或者 “踩到地雷”后，能够“结束游戏”。 同时在 游戏结束 后 没有重新开始之前，雷区不在响应用户的操作，并提示用户“游戏胜利”或“失败”。

如何判定胜利还是失败呢？胜利即就是用户把所有的地雷都用“插旗”的方式标记了出来；失败即就是打开的格子中有地雷。由此我们需要调整上述 标记地雷 和 打开格子 两处动作的处理代码。

首先，我们将用于显示“胜利”、“失败” 的遮罩层加入雷区：

``` html
	<!-- 游戏主界面 -->
	<div class="block main">
		雷区
		<div class="cover"></div>
	</div>
```
加入响应的外观样式描述：

``` css
.block.main {
	position: relative; /* 让其内部的元素参照定位 */
}
.block.main .cover {
	/* 占满父级元素 */
	position: absolute;
	top: 0; left: 0;
	width: 100%; height: 100%;
	/* 遮盖其他元素 */
	z-index: 1;
	/* 半透明 黑色背景 */
	background: rgba(0,0,0,0.4);
	/* 文字特征 */
	color: #fff;
	font-family: "华文行楷","楷体","微软雅黑","新宋体"; /* 优先使用前面的字体，找不到尝试下一个 */
	font-size: 48px; /* 文字大一些 */
	padding: 240px; /* 文字上下做一些留白 */
	text-align: center; /* 文字居中 */
}
```

> `rgba(x,y,z,a)` 用于使用类似函数调用形式来制定一个带透明度的颜色值，  
> x, y , z 分别值 red / green / blue 的原色值，取值 0 ~ 255 或 0x00 ~ 0xff，a 表示透明度，取值 0.00 ~ 1.00；  
> `rgb(x,y,z)` 也用于描述颜色，除了没有透明度值，其余与 `rgba` 相同；  
>
> 我们接触到的颜色描述方式举例来说，下面的四个颜色描述其实是一样的：  
> `rgb(0x64,0x64,0x64)` = `rgb(100,100,100)` = `rgba(100,100,100,1.0)` = `#646464`

然后，我们调整“插旗”加入胜利的判断：

``` js
function flagCell($cell) {
	$cell.find(".mask").toggleClass(".flag"); // 插上或去掉 旗子
	var $flags = $field.find(".mask.flag"), // 所有旗子
		flagsCount = $flags.length,
		$bombs = $field.find(".cell.bomb"), // 所有地雷
		bombsCount = $bombs.length;
	// 在整个雷区中扫描所有已经标记了旗子的格子，确认其是否都有地雷
	$flags.each(function() {
		if($(this).parent().hasClass("bomb")) {
			--flagsCount;
		}
	});
	// 整个雷区中所有地雷都被旗子标记
	$bombs.each(function() {
		if($(this).find(".mask").hasClass("flag")) {
			--bombsCount;
		}
	});
	// 上面两个条件都满足
	if(flagsCount === 0 && bombsCount === 0) {
		// 胜利了，显示胜利提示
		$(".block.main .cover").text("你是一个值得称赞的工兵！").show();
		$(MineSweeperField).trigger("victory") // 自定义事件
		// 在下一章我们会使用这里的事件，处理优秀流程逻辑
	}
}
```

再次，在 `openCell()` 打开格子的处理中加入下面代码，判断“踩到了地雷”：

``` js
// 是否踩到了地雷？
if($cell.hasClass("bomb")) {
	// 踩到地雷了，显示失败提示
	$(".block.main .cover").text("轰~").show();
	$(MineSweeperField).trigger("defeat"); // 自定义事件
}
```

最后在 `reset` 接口末尾加入：

``` js
	// 将胜利、失败的遮盖层隐藏起来
	$(".block.main .cover").hide();
```

**注意**：胜利、失败提示会遮盖雷区，换句话说，提示显示的时候，雷区就无法被操作到了。

这个时候大家测试我们目前的程序，需要在 开发者工具 <kbd>F12</kbd> 的 **console** 控制台中调用一次 `reset()` 才能隐藏这个遮罩层：

![胜利](4-field-victory.png)

#### 布雷

所谓布雷，即就是随机的在雷区中选择一些位置，放下地雷即可。但要考虑随机数重合，即选择的位置可能与之前相同的问题。所以为了能够布置“**一定量**”的地雷，我们需要知道目标格子是否已经有地雷了。
前面我们已经尝试使用接口来进行布雷了，但布雷其实交给 雷区 这个模块就可以处理了，不需要对外。所以我们把 `putBomb` 降级为内部函数，并在 `reset()` 中加入调用：

``` js

// 布置地雷，降级为函数
function putBomb(x,y) {
	if(nums[x+":"+y] == -1) return false; // 该格子里已经有地雷了，不能再放了
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
	return true; // 成功的放置了地雷
}
// 调整对外接口
window.MineSweeperField = {
	// 清理已经布置的地雷，重置雷区
	reset: function(count) { // 增加 count 参数，用于传入地雷数量
		// 清理
		for(var key in cells) {
			// 移除地雷
			cells[key].removeClass("bomb");
			// 显示遮罩
			cells[key].find(".mask").prop("hidden", false);
			// 清除各自中的数字
			cells[key].find("span").text("");
			// 所有标记清除
			nums[key] = 0;
		}
		// 布雷
		// -------------------------------------------
		for(var i=0;i<count;++i) {
			var x = parseInt(Math.random() * WIDTH), // 使用随机数
				y = parseInt(Math.random() * HEIGHT); // 使用随机数

			if(!putBomb(x, y)) { // 没有成功布雷（重复位置）
				--i;
			}
		}
		// -------------------------------------------
		// 将胜利、失败的遮盖层隐藏起来
		$(".block.main .cover").hide();
	},
	// 删除这里的 putBomb: .....
}
```

> **`Math`** 是浏览器提供给我的数学相关函数的**对象**，其中包含了 `.sin()` `.cos()` `.PI` 等三角函数、常量，  
> `.exp()` `.log()` 等次方、指数函数，  
> `.max()` `.min()` 求最大最小值，  
> `.ceil()` `.floor()` 求近似整数值等函数，  
> `.random()` 用于获取一个介于 [0.00 ~ 1.00) 之间的浮点数 （ 可能为 0 但不会为 1）  
> 例如：  
> `Math.random() * 100` 可以获得一个介于 [0.0 ~ 100.0) 之间的浮点数；  
> <hr/>
> `parseInt()` 用于将一个非整数类型的数值表达式或文本形式的数字，转换成一个整数（小数直接抛弃）；

到这里，其实我们的游戏已经基本完工了。剩下的工作，就是将我们在这四章中设计的三个模块，串联起来，形成一个完整的游戏，大家可以自行尝试。

#### 完整版本演示

[demo]({{< param demo >}})