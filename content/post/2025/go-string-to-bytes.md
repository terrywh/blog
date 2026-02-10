---

title: "避免内存拷贝的字符串与字节串互转（Go）"
date: 2025-06-25
tags:
  - go

---

* 正常强制转换：
  ``` go
  func s2b(s string) []byte {
      return []byte(s)
  }
  func b2s(b []byte) string {
      return string(b)
  }
  ```

* 避免内存拷贝(旧版本）：
    ``` go
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

* 避免内存拷贝（新版本 >= 1.20）：
    ``` go
    func s2b(s string) (b []byte) {
        return unsafe.Slice(unsafe.StringData(s), len(s))
    }
    func b2s(b []byte) string {
        return unsafe.String(unsafe.SliceData(b), len(b))
    }
    ```
