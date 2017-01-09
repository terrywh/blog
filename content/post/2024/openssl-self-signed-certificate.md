+++

title = "Openssl 字签证书（域名、IP）"
date = 2021-10-13
tags = ["openssl", "shell"]
thumbnail = "https://github.com/openssl/openssl/raw/master/doc/images/openssl.svg"

+++

#### 生成 ROOT/CA 根证书

``` bash
openssl req -x509 -nodes -new -sha256 -days 1024 -newkey rsa:2048 -keyout root_ca.key -out root_ca.pem -subj "/C=CN/O=Orgnization/OU=OrgizationUnit/CN=CommonName"
openssl x509 -outform pem -in root_ca.pem -out root_ca.crt
```

#### 签发证书

* 配置文件
注意：
1. 缺失 `nonRepudiation` 在新版本 Chrome 中导致 SSL_ERR_IMCOMPATIBLE 错误无法继续访问；*(更新：2023-12-22)*
2. 该配置文件实际在 签发申请 和 签发证书 时都需要使用；

``` config
# filename="server.conf"
[req]
distinguished_name = req_dn
req_extensions = req_ext
x509_extensions = x509_ext
prompt = no

[req_dn]
C = CN
ST = Beijing
L = Beijing
O = Orgnization
OU = OrgnizationUnit
CN = CommonName

[req_ext]
keyUsage = nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth

[x509_ext]
keyUsage = nonRepudiation, keyEncipherment, dataEncipherment
subjectKeyIdentifier = hash
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = *.domainname.com
IP.2 = 10.0.0.1
```

* 签发申请

``` bash
openssl req -new -nodes -newkey rsa:2048 -keyout server.key -out server.csr -config server.conf
```

* 签发证书

``` bash
openssl x509 -req -sha256 -days 1024 -in server.csr -CA root_ca.pem -CAkey root_ca.key -CAcreateserial -extfile server.conf -extensions x509_ext -out server.crt
```


