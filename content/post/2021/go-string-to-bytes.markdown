---

title: "避免内存拷贝的字符串与字节串互转（Go）"
date: 2021-10-14
tags:
  - go
thumbnail: "https://camo.githubusercontent.com/ff89c51c9e5a3de2b752b37bf6ab32401b9649d7acb1633ece9a40c85ae28b95/68747470733a2f2f676f6c616e672e6f72672f646f632f676f706865722f6669766579656172732e6a7067"

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

* 避免内存拷贝：
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

