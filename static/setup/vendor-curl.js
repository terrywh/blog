#! ~/.bun/bin/bun

import { $, semver } from "bun";
import os from "node:os";
import fs from "node:fs/promises";

const concurrency = Math.trunc((os.cpus().length * 3) / 4);

// Directory configuration (can be overridden via environment variables)
const CONFIG = {
    serverDir: process.env.SERVER_DIR || "/data/server",
    vendorDir: process.env.VENDOR_DIR || "/data/vendor",
    mirror: "https://gh-proxy.com/", // GitHub Release 代理加速地址
};

async function isDirectory(path) {
    try {
        return (await fs.stat(path)).isDirectory();
    } catch (ex) {
        return false;
    }
}

async function isFile(path) {
    try {
        const stat = await fs.stat(path);
        return stat.isFile() && stat.size > 0;
    } catch (ex) {
        return false;
    }
}

async function wget(url, filename) {
    // URL和filename都已提前拼接好，直接使用单个插值
    await $`wget --quiet --show-progress --progress=bar:force:noscroll -O ${filename} ${url}`;
}

// 查找安装到 prefix 下的静态库，兼容 lib/lib64 两种布局
async function findLibrary(prefix, name) {
    for (const libdir of ["lib64", "lib"]) {
        const path = `${prefix}/${libdir}/${name}`;
        if (await isFile(path)) {
            return path;
        }
    }
    return null;
}

async function fetchLatestVersion(repository, pattern) {
    const html = await (
        await fetch(`https://github.com/${repository}/releases/latest/`)
    ).text();
    const match = pattern.exec(html);
    if (match === null) {
        throw new Error(`unable to detect the latest version of ${repository}.`);
    }
    return match[1];
}

// --------------------------------------------------------------- c-ares 前置依赖

async function caresSetup() {
    const setup = Bun.file("c-ares-setup.json");
    let stats;
    try {
        stats = await setup.stat();
    } catch (ex) {
        stats = null;
    }
    if (stats === null || Date.now() - stats.mtime.getTime() > 3600 * 1000) {
        const version = await fetchLatestVersion(
            "c-ares/c-ares",
            /<h1 [^>]+>v?([0-9][^<\s]*)/,
        );
        const filename = `c-ares-${version}.tar.gz`;
        await Bun.write(setup, JSON.stringify({ version, filename }));
        const url = `${CONFIG.mirror}https://github.com/c-ares/c-ares/releases/download/v${version}/${filename}`;
        return { filename, url, version };
    } else {
        const { version, filename } = await setup.json();
        const url = `${CONFIG.mirror}https://github.com/c-ares/c-ares/releases/download/v${version}/${filename}`;
        return { filename, url, version };
    }
}

// 以 -fPIC 静态库的形式编译安装 c-ares，并返回其 include 与 library 路径
async function installCares() {
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    const { filename, url, version } = await caresSetup();
    console.log(`c-ares dependency: ${filename}`);
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    if (await isFile(filename)) {
        console.log("already exists.");
    } else {
        await $`rm -f ${filename}`;
        await wget(url, filename);
    }

    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    console.log("deflating ...");
    const srcDir = `c-ares-${version}`;
    if (!(await isDirectory(srcDir))) {
        await $`tar xf ${filename}`;
    }

    const installPrefix = `${CONFIG.vendorDir}/c-ares-${version}`;
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    const cmakeCmd = `cd ${srcDir} && cmake -G Ninja -B build -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=${installPrefix} -DCARES_STATIC=ON -DCARES_SHARED=OFF -DCARES_STATIC_PIC=ON -DCARES_BUILD_TOOLS=OFF -DCARES_BUILD_TESTS=OFF -DCARES_INSTALL=ON`;
    await $`${{ raw: cmakeCmd }}`;
    const ninjaInstallCmd = `cd ${srcDir} && ninja -C build install`;
    await $`${{ raw: ninjaInstallCmd }}`;

    const includeDir = `${installPrefix}/include`;
    const library = await findLibrary(installPrefix, "libcares.a");
    if (library === null) {
        throw new Error(`c-ares static library not found under ${installPrefix}.`);
    }
    return { includeDir, library };
}

// 查找 /data/vendor 下由 vendor-openssl.js 安装的 OpenSSL（取版本最高的一个，
// 并兼容手工维护的 `openssl` 稳定软链）
async function findOpenssl() {
    const candidates = (await fs.readdir(CONFIG.vendorDir).catch(() => []))
        .filter((name) => name.startsWith("openssl-"))
        .sort((a, b) => {
            const va = a.slice("openssl-".length);
            const vb = b.slice("openssl-".length);
            try {
                return -semver.order(va, vb);
            } catch (ex) {
                return vb.localeCompare(va);
            }
        })
        .map((name) => `${CONFIG.vendorDir}/${name}`);
    candidates.push(`${CONFIG.vendorDir}/openssl`);

    for (const dir of candidates) {
        if (!(await isFile(`${dir}/include/openssl/ssl.h`))) {
            continue;
        }
        if (await findLibrary(dir, "libssl.a")) {
            return dir;
        }
    }
    return null;
}

// -------------------------------------------------------------------- curl

async function setup() {
    const setup = Bun.file("curl-setup.json");
    let stats;
    try {
        stats = await setup.stat();
    } catch (ex) {
        stats = null;
    }
    if (stats === null || Date.now() - stats.mtime.getTime() > 3600 * 1000) {
        const version = await fetchLatestVersion(
            "curl/curl",
            /<h1 [^>]+>v?([0-9][^<\s]*)/,
        );
        const filename = `curl-${version}.tar.gz`;
        await Bun.write(setup, JSON.stringify({ version, filename }));
        const tag = `curl-${version.replace(/\./g, "_")}`;
        const url = `${CONFIG.mirror}https://github.com/curl/curl/releases/download/${tag}/${filename}`;
        return { filename, url, version };
    } else {
        const { version, filename } = await setup.json();
        const tag = `curl-${version.replace(/\./g, "_")}`;
        const url = `${CONFIG.mirror}https://github.com/curl/curl/releases/download/${tag}/${filename}`;
        return { filename, url, version };
    }
}

async function build() {
    if (os.platform() !== "darwin" && (await isFile(`${CONFIG.serverDir}/compiler/bin/gcc`))) {
        $.env({
            ...process.env,
            CXX: `${CONFIG.serverDir}/compiler/bin/g++`,
            CC: `${CONFIG.serverDir}/compiler/bin/gcc`,
            LDFLAGS:
                `-Wl,-rpath,${CONFIG.serverDir}/compiler/lib64 -L${CONFIG.serverDir}/compiler/lib64`,
        });
    }

    // c-ares 必须先于 curl 编译安装，并由 curl 引用
    const cares = await installCares();
    const openssl = await findOpenssl();

    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    const { filename, url, version } = await setup();
    console.log(filename);
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    if (await isFile(filename)) {
        console.log("already exists.");
    } else {
        await $`rm -f ${filename}`;
        await wget(url, filename);
    }

    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    console.log("deflating ...");
    const srcDir = `curl-${version}`;
    if (!(await isDirectory(srcDir))) {
        await $`tar xf ${filename}`;
    }

    const installPrefix = `${CONFIG.vendorDir}/curl-${version}`;
    // 编译为 -fPIC 的静态 libcurl 及静态链接的 curl 二进制
    const options = [
        `-DCMAKE_BUILD_TYPE=Release`,
        `-DCMAKE_INSTALL_PREFIX=${installPrefix}`,
        `-DCMAKE_POSITION_INDEPENDENT_CODE=ON`,
        `-DBUILD_SHARED_LIBS=OFF`,
        `-DBUILD_STATIC_LIBS=ON`,
        `-DBUILD_CURL_EXE=ON`,
        `-DBUILD_STATIC_CURL=ON`,
        `-DBUILD_TESTING=OFF`,
        `-DBUILD_EXAMPLES=OFF`,
        `-DBUILD_LIBCURL_DOCS=OFF`,
        `-DBUILD_MISC_DOCS=OFF`,
        `-DENABLE_CURL_MANUAL=OFF`,
        `-DENABLE_ARES=ON`,
        `-DCARES_USE_STATIC_LIBS=ON`,
        `-DCARES_INCLUDE_DIR=${cares.includeDir}`,
        `-DCARES_LIBRARY=${cares.library}`,
        `-DUSE_NGHTTP2=OFF`,
        `-DUSE_NGTCP2=OFF`,
        `-DUSE_QUICHE=OFF`,
        `-DUSE_LIBIDN2=OFF`,
        `-DCURL_USE_LIBPSL=OFF`,
        `-DCURL_USE_LIBSSH2=OFF`,
        `-DCURL_USE_LIBSSH=OFF`,
        `-DCURL_USE_GSASL=OFF`,
        `-DCURL_USE_GSSAPI=OFF`,
        `-DCURL_USE_LIBBACKTRACE=OFF`,
        `-DCURL_BROTLI=OFF`,
        `-DCURL_ZSTD=OFF`,
    ];
    if (openssl === null) {
        console.warn(
            `WARNING: no OpenSSL installation found under ${CONFIG.vendorDir}, building curl without TLS support. Run static/setup/vendor-openssl.js first to enable HTTPS.`,
        );
        options.push(`-DCURL_ENABLE_SSL=OFF`);
    } else {
        console.log(`using vendored OpenSSL: ${openssl}`);
        options.push(`-DCURL_USE_OPENSSL=ON`);
        options.push(`-DOPENSSL_ROOT_DIR=${openssl}`);
        options.push(`-DOPENSSL_USE_STATIC_LIBS=ON`);
    }
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    const cmakeCmd = `cd ${srcDir} && cmake -G Ninja -B build ${options.join(" ")}`;
    await $`${{ raw: cmakeCmd }}`;
    const ninjaBuildCmd = `cd ${srcDir} && ninja -C build -j${concurrency}`;
    await $`${{ raw: ninjaBuildCmd }}`;
    const ninjaInstallCmd = `cd ${srcDir} && ninja -C build install`;
    await $`${{ raw: ninjaInstallCmd }}`;
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    console.log("done.");
}

async function clean() {
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    console.log("cleaning up ...");
    const { filename, version } = await setup();
    const cares = await caresSetup();
    await $`rm -rf ${filename}`;
    await $`rm -rf curl-${version}`;
    await $`rm -rf ${cares.filename}`;
    await $`rm -rf c-ares-${cares.version}`;
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    console.log("done.");
}

if (process.argv[2] === "clean") {
    await clean();
} else {
    await build();
}
