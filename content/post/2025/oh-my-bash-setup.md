---

title: "安装和配置 Oh-My-Bash"
date: 2025-03-28
tags: 
  - bash

---

> 虽然出现了很多 bash 的替代品，但在 linux 下默认的 shell 依然还是 bash 简单配置下还是不错的;
> https://github.com/ohmybash/oh-my-bash/


* 安装
``` bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/ohmybash/oh-my-bash/master/tools/install.sh)"
```

* 选项

    * 文件覆盖：
    ``` bash
    # ~/.oh-my-bash/lib/shopt.sh
    set -o noclobber
    ```

    * 默认主体（调整24小时制）：
    ``` bash
    # ~/.oh-my-bash/themes/font/font.theme.sh
    THEME_CLOCK_FORMAT=${THEME_CLOCK_FORMAT:-"%H:%M:%S"}
    ```

    * 切换主题：
    ``` bash
    # ~/.bashrc
    OSH_THEME="powerline-multiline"
    ```

    * 隐藏主机用户：
    ``` bash
    # ~/.oh-my-bash/themes/powerline-multiline/powerline-multiline.theme.sh
    POWERLINE_RIGHT_PROMPT=${POWERLINE_RIGHT_PROMPT:="in_vim clock battery"}
    ```

* 更新
``` bash
cd ~/.oh-my-bash
git stash # 暂存变更
git pull  # 更新对齐
git stash pop # 恢复变更
git diff # 确认变更
```
