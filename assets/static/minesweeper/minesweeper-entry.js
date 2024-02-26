(function($) {
	// 使用 $("#xxxxxxx") 这种形式来访问网页中对应的 id="xxxxxxx" 的元素
	// 在输入框中发生 键盘 “抬起” keyup 或 “按下” keydown 时
	$("#entry_input_name").on("keyup keydown", function(e) {
		// 执行这段代码，保存当前输入框中的内容
		localStorage.setItem("entry_input_name", $(this).val())
		// 在这种事件处理函数内部，this 即就是当前处理的元素（"#entry_input_name"）
	})
	// 每次执行这里时，把保存的内容读取出来，并重新放回到输入框
	$("#entry_input_name").val(	localStorage.getItem("entry_input_name") )
	// 第二个 $("#entry_input_name") 可以省略，让 .val 跟在前面 }) 后面
	// 因为上面的操作都是针对 #entry_input_name 这个元素
	$("#entry_submit").on("submit", function(e) {
		e.preventDefault();
		// 开始游戏
		$(MineSweeperEntry).trigger("start");
	});
	// 对外接口
	window.MineSweeperEntry = {
		// 接口1. 获取当前用户名
		getName: function() {
			return localStorage.getItem("entry_input_name") || "无名氏"
		},

	}
	// 位置 (D)
}(jQuery))
