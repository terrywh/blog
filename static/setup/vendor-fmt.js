#! ~/.bun/bin/bun

import { $ } from "bun";
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

async function latest() {
    const html = await (
        await fetch(`https://github.com/fmtlib/fmt/releases/latest/`)
    ).text();
    const match = /<h1 [^>]+>v?([0-9][^<\s]*)/.exec(html);
    if (match === null) {
        throw new Error("unable to detect the latest fmt version.");
    }
    return [match[1]];
}

async function setup() {
    const setup = Bun.file("fmt-setup.json");
    let stats;
    try {
        stats = await setup.stat();
    } catch (ex) {
        stats = null;
    }
    if (stats === null || Date.now() - stats.mtime.getTime() > 3600 * 1000) {
        const [version] = await latest();
        const filename = `fmt-${version}.tar.gz`;
        await Bun.write(setup, JSON.stringify({ version, filename }));
        const url = `${CONFIG.mirror}https://github.com/fmtlib/fmt/archive/refs/tags/${version}.tar.gz`;
        return { filename, url, version };
    } else {
        const { version, filename } = await setup.json();
        const url = `${CONFIG.mirror}https://github.com/fmtlib/fmt/archive/refs/tags/${version}.tar.gz`;
        return { filename, url, version };
    }
}

async function build() {
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
    const srcDir = `fmt-${version}`;
    if (!(await isDirectory(srcDir))) {
        await $`tar xf ${filename}`;
    }
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    if (os.platform() !== "darwin" && (await isFile(`${CONFIG.serverDir}/compiler/bin/gcc`))) {
        $.env({
            ...process.env,
            CXX: `${CONFIG.serverDir}/compiler/bin/g++`,
            CC: `${CONFIG.serverDir}/compiler/bin/gcc`,
            LDFLAGS:
                `-Wl,-rpath,${CONFIG.serverDir}/compiler/lib64 -L${CONFIG.serverDir}/compiler/lib64`,
        });
    }
    const installPrefix = `${CONFIG.vendorDir}/fmt-${version}`;
    // 编译为 -fPIC 的静态库，供后续静态链接使用
    const cmakeCmd = `cd ${srcDir} && cmake -G Ninja -B build -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=${installPrefix} -DBUILD_SHARED_LIBS=OFF -DCMAKE_POSITION_INDEPENDENT_CODE=ON -DFMT_INSTALL=ON -DFMT_TEST=OFF -DFMT_DOC=OFF`;
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
    const srcDir = `fmt-${version}`;
    await $`rm -rf ${filename}`;
    await $`rm -rf ${srcDir}`;
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
