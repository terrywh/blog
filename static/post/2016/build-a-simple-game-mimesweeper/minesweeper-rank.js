(function($) {
	// 位置： (C)
	var data = localStorage.getItem("rank_data")
	if(!data) {
		data = [ // 为演示方便，我们初始化一些数据
			{name:"DemoUserA", time:200}, // 直接使用 XXX 秒 来描述 耗时
			{name:"DemoUserB", time:300}, // 展示的时候用程序将其变为 XX 分 XX 秒的形式
			{name:"DemoUserC", time:400},
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
		}
	}
	// XXX 秒 => XX 分 XX 秒
	function renderTime(time) {
		return parseInt(time/60) + " 分 " + (time % 60) + " 秒"
	}
	// 刷新页面时立刻进行“渲染”
	render()
	// 位置：(B)
	window.MineSweeperRank = { // window 为全局命名空间，同时也代表了浏览器当前打开网页的窗口
		appendUserRank: function(name, time) { // 加入用户及成绩
			// 将成绩插入到 data 中的合适位置
			// 从后往前，找到用时小于当前 time 的地方
			for(var i=data.length-1; i>=0; --i) {
				if(data[i].time < time) {
					data.splice(i + 1, 0, {"name": name, "time": time}) // 从 i + 1 这个位置开始，删除 0 个元素，加入 新增元素
					break // 找到了速度更快的记录，跳出循环（这时 i 应该还大于等于 0）
				}
			}
			if(i == -1) { // 没有找到比当前值更小的了，排在第一名
				data.splice(0, 0, {"name": name, "time": time})
			}
			// 截取 data 的前 10 项（不要让排行榜太长了）
			data = data.slice(0, 6)
			// 数据更新了，我们需要对应更新界面，即重新渲染
			render()
			// 保存数据
			localStorage.setItem( "rank_data", JSON.stringify(data) )
		},
	}
	$(MineSweeperField).on("victory", function(e, duration) {
		MineSweeperRank.appendUserRank(MineSweeperEntry.getName(), parseInt(duration/1000));
	});
}(jQuery))
