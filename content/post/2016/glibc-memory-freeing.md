---

title: "Linux 下 GLIBC 内存回收的疑问"
date: 2016-02-23
tags:
  - c++
  - debug
  - linux

---

记得好早之前刚刚接触 Linux 下 C/C++ 开发的时候就有个疑问：在程序内 free 掉的空间没有立刻交换给操作系统，程序进程的内存没有减少。后来一度在开发各种长连接程序时 GOOGLE 各种资料，最近又偶尔遇到，借此机会把相关的说法整理如下。

其中两个重点内容如下：

1. [Freeing Memory Allocated with malloc](http://www.gnu.org/software/libc/manual/html_node/Freeing-after-Malloc.html)：
注意这里的 “**Occasionally**” 用词；
> Occasionally, `free` can actually return memory to the operating system and make the process smaller. Usually, all it can do is allow a later call to `malloc` to reuse the space. In the meantime, the space remains in your program as part of a free-list used internally by `malloc`.    


2. [Linux Programmer's Manual - mallopt](http://man7.org/linux/man-pages/man3/mallopt.3.html)：
注意默认配置 `128*1024` 数值；
> **M_TRIM_THRESHOLD**  
> When the amount of contiguous free memory at the top of the heap grows sufficiently large, `free(3)` employs `sbrk(2)` to release this memory back to the system.  (This can be useful in programs that continue to execute for a long period after freeing a significant amount of memory.)  The `M_TRIM_THRESHOLD` parameter specifies the minimum size (in bytes) that this block of memory must reach before `sbrk(2)` is used to trim the heap.
> 
> The default value for this parameter is `128*1024`. Setting `M_TRIM_THRESHOLD` to -1 disables trimming completely.
> 
> Modifying `M_TRIM_THRESHOLD` is a trade-off between increasing the number of system calls (when the parameter is set low) and wasting unused memory at the top of the heap (when the parameter is set high).
>

根据上面的资料，总结一下：

> **内存会在 `free` 后被后续的 `malloc` 复用，当 `free` 的栈顶连续内存达到 `M_TRIM_THRESHOLD` 描述的值（默认 128kB）后归还系统;**
