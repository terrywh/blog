---

title: "Go 功能演示"
date: 2021-10-14
tags:
  - go
categories: post

---

* 字符串 `string` <=> `[]byte` 字节序列转化  
``` c++
func s2b(s string) (b []byte) {
    /* #nosec G103 */
    bh := (*reflect.SliceHeader)(unsafe.Pointer(&b))
    /* #nosec G103 */
    sh := (*reflect.StringHeader)(unsafe.Pointer(&s))
    bh.Data = sh.Data
    bh.Cap = sh.Len
    bh.Len = sh.Len
    return b
}

func b2s(b []byte) string {
    /* #nosec G103 */
    return *(*string)(unsafe.Pointer(&b))
}
```
