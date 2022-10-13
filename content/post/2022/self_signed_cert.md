+++

title = "Openssl 字签证书（域名、IP）"
date = "2021-10-13"
tags = ["openssl", "self signed"]
cover = "/images/default-cover.png"
categories = "笔记"

+++

#### 生成 ROOT/CA 根证书

``` bash
openssl req -x509 -nodes -new -sha256 -days 1024 -newkey rsa:2048 -keyout root_ca.key -out root_ca.pem -subj "/C=CN/O=Orgnization/OU=OrgizationUnit/CN=CommonName"
openssl x509 -outform pem -in root_ca.pem -out root_ca.crt
```

#### 签发证书

* 配置文件
``` config
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
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth

[x509_ext]
subjectKeyIdentifier = hash
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = *.meeting.tencent.com
IP.2 = 10.0.1.47
```

* 签发申请
```
openssl req -new -nodes -newkey rsa:2048 -keyout server.key -out server.csr -config server.conf
```

* 签发证书
``` bash
openssl x509 -req -sha256 -days 1024 -in server.csr -CA root_ca.pem -CAkey root_ca.key -CAcreateserial -extfile server.conf -extensions x509_ext -out server.crt
```

> 注意：该配置文件实际在 签发申请 和 签发证书 时都需要使用；
