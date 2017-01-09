---

title: "注册表常用设置"
date: 2017-08-01
tags: 
  - windows

thumbnail: "/post/2017/windows-registry-utility/thumbnail.png"

---


各处收集到的各种调整 Windows 配置相关的注册表项，记录以备不时之需~

* `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced\DisabledHotkeys` (`REG_EXPAND_SZ`)
> "SA" - 禁用 `Win + S/A` 快捷键
* `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Power\PowerSettings\7516b95f-f776-4464-8c53-06167f40cc99\8EC4B3A5-6868-48c2-BE75-4F3044BE88A7` (`REG_DWORD`)
> `0x00000002` - 开启额外的电源设置 “控制台锁定后显示关闭超时”
* `HKEY_CURRENT_USER\Software\Classes\CLSID\{018D5C66-4533-4307-9B53-224DE2ED1FE6}\System.IsPinnedToNameSpaceTree` (`REG_DWORD`)
> `0x00000000` - 隐藏 OneDrive 在 Explorer 左侧列表项
* `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\TimeZoneInformation` (`REG_DWORD`)
> `0x00000001` - 标识 Bios 时间为 UTC 标准时间（配合 LINUX 双系统）
