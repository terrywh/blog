(function($) {
	var $field = $("<div class=\"field\"></div>").appendTo(".block.main"); // 创建一个 div 元素用来容纳雷区，并将其加入之前页面中
	// 我们暂时将雷区定义为 24 * 24 个格子，大家可以尝试调整为其他数值
	// 每个格子定义为 24 大小
	var SIZE = 24, WIDTH = 24, HEIGHT = 24, START;
	var cells = {}, // 用于记录每个格子元素
		nums  = {}; // 用于记录每个格子中的数字
		// 如果对应格子不存在标记的数字，默认是 0（周围没有地雷）
		// 如果对应的格子中是地雷，在 nums[x:y] 标记 -1
	for(var x=0;x<WIDTH;++x) {
		for(var y=0;y<HEIGHT;++y) {
			// 使用绝对定位，根据 x y 计算出每个格子的位置；
			cells[x+":"+y] = $("<div class=\"cell\" style=\"left: "+(x*SIZE)+"px; top: "+(y*SIZE)+"px;\">" +
				"<div class=\"mask\"></div>" +
				"<span></span>" +
				"</div>")
					.appendTo($field)
					.data("x", x) // 将 x 坐标保存在元素中
					.data("y", y);
			// 我们将每个格子的元素保存在 “x:y” 这个一个名称中，方便将来访问对应的元素
			// 当然也可以使用二位数组实现类似 cells[x][y] 这种方式，大家可以尝试
			nums[x+":"+y] = 0; // 暂时左右的格子都没有地雷
		}
	}
	// 位置 (A)
	$field.on("click", ".cell", function(e) { // 左键点击的处理
		openCell($(this)); // 打开当前格子
	}).on("contextmenu", ".cell", function(e) { // 右键点击的处理
		e.preventDefault(); // 防止浏览器弹出自身的上下文菜单
		// 插上旗子
		flagCell($(this));
	})
	// 打开指定的格子
	function openCell($cell) {
		if(!$cell || $cell.find(".mask").prop("hidden")) { // 连续打开的停止条件
			return;
			// 1. 当前格子不存在（向周围寻找时超出了范围）
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
		// 是否踩到了地雷？
		if($cell.hasClass("bomb")) {
			// 踩到地雷了，显示失败提示
			$(".block.main .cover").text("轰~").show();
			$(MineSweeperField).trigger("defeat"); // 自定义事件
		}
	}

	function flagCell($cell) {
		if($cell.find(".mask").prop("hidden")) return;
		$cell.find(".mask").toggleClass("flag"); // 插上或去掉 旗子
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
			$(MineSweeperField).trigger("victory", Date.now() - START); // 自定义事件
			// 在下一章我们会使用这里的事件，处理优秀流程逻辑
		}
	}

	// 使指定的格子中的提示数字加 1
	function incrCell(x, y) {
		// ? : 是 三元运算符，请参看下文说明
		var n = nums[x+":"+y]; // 当 numbs[x+":"+y] 对应的元素不存在时，获取 0 值
		// ++++++++++++++++++++++++++++++++++++++++++++++++++++++
		if(n === undefined) { // !!! 边界条件，x y 指示不再雷区内
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
	}
	$(MineSweeperEntry).on("start", function() {
		MineSweeperField.reset( parseInt(Math.random()*80) + 20 );
		START = Date.now();
	});
}(jQuery))
