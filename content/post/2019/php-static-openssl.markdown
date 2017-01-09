---

title: "PHP 静态链接 openssl/nghttp2 及外部扩展"
date: 2019-05-08
tags: 
  - php
  - c++
---

# {{page.title}}

> 注意: 以下过程是为 使用链接 openssl 静态库, 方便部署规划的编译配置; 使用动态连接的情况很多流程可以简化（无需对 config.m4 进行修改）;

* openssl 1.1.1b
```
CC=gcc CXX=g++ ./Configure no-shared --prefix=/data/vendor/openssl-1.1.1 linux-x86_64
```

* nghttp2 1.38.0
```
PKG_CONFIG_PATH=/data/vendor/openssl-1.1.1/lib/pkgconfig CC=gcc CXX=g++ CFLAGS=-fPIC CXXFLAGS=-fPIC ./configure --prefix=/data/vendor/nghttp2-1.38.0 --enable-shared=no --enable-lib-only # --with-boost=/data/vendor/boost-1.70.0 --enable-asio-lib
```

* curl 7.64.1
```
CC=gcc CXX=g++ CFLAGS=-fPIC CPPFLAGS=-fPIC ./configure --prefix=/data/vendor/curl-7.64.1 --with-nghttp2=/data/vendor/nghttp2-1.38.0 --with-ssl=/data/vendor/openssl-1.1.1 --with-pic=pic --enable-ipv6 --enable-shared=no --without-libidn2 --disable-ldap --without-libpsl --without-lber --enable-ares
```

* php 7.2.18
```
CC=gcc CXX=g++ ./configure --prefix=/data/vendor/php-7.2.18 --with-config-file-path=/data/vendor/php-7.2.18/etc --disable-simplexml --disable-xml --disable-xmlreader --disable-xmlwriter --with-readline --enable-mbstring --without-pear --with-zlib --build=x86_64-linux-gnu
```
ldd
> 扩展

  ```
  cd ext/*****
  /data/vendor/php-7.2.17/bin/phpize
  mv config0.m4 config.m4
  ```

* 扩展 openssl.so
```
CC=gcc CXX=g++ LDFLAGS="-pthread -ldl" ./configure --with-php-config=/data/vendor/php-7.2.17/bin/php-config --with-openssl=/data/vendor/openssl-1.1.1 --build=x86_64-linux-gnu
```

* 扩展 curl.so
> 调整 config.m4 以忽略内部检查(检查本身会引起链接问题)

  ```
  # 41    CURL_LIBS=`$PKG_CONFIG --libs --static  $PKNAME`
  # 168	#  PHP_CHECK_LIBRARY(curl,curl_easy_perform,
  # 169	#  [
  # 170	    AC_DEFINE(HAVE_CURL,1,[ ])
  # 171	#  ],[
  # 172	#    AC_MSG_ERROR(There is something wrong. Please check config.log for more information.)
  # 173	#  ],[
  # 174	#    $CURL_LIBS
  # 175	#  ])
  # 176
  # 177	#  PHP_CHECK_LIBRARY(curl,curl_easy_strerror,
  # 178	#  [
  # 179	    AC_DEFINE(HAVE_CURL_EASY_STRERROR,1,[ ])
  # 180	#  ],[],[
  # 181	#    $CURL_LIBS
  # 182	#  ])
  # 183
  # 184	#  PHP_CHECK_LIBRARY(curl,curl_multi_strerror,
  # 185	#  [
  # 186	    AC_DEFINE(HAVE_CURL_MULTI_STRERROR,1,[ ])
  # 187	#  ],[],[
  # 188	#    $CURL_LIBS
  # 189	#  ])
  ```
> 配置扩展

  ```
  CC=gcc CXX=g++ LDFLAGS="-L/data/vendor/nghttp2-1.38.0/lib -L/data/vendor/openssl-1.1.1/lib" ./configure --with-php-config=/data/vendor/php-7.2.18/bin/php-config --with-curl=/data/vendor/curl-7.64.1 --build=x86_64-linux-gnu
  ```
