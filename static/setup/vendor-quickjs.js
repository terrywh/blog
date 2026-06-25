#! ~/.bun/bin/bun

import { $, semver } from "bun";
import os from "node:os";
import fs from "node:fs/promises";

const concurrency = Math.trunc((os.cpus().length * 3) / 4);

// Directory configuration (can be overridden via environment variables)
const CONFIG = {
    serverDir: process.env.SERVER_DIR || "/data/server",
    vendorDir: process.env.VENDOR_DIR || "/data/vendor",
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
        return (await fs.stat(path)).isFile();
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
        await fetch(`https://github.com/quickjs-ng/quickjs/releases/latest/`)
    ).text();
    const match = /<h1 [^>]+>v([^<]+)<\/h1>/.exec(html);
    return [match[1]];
}

async function setup() {
    const setup = Bun.file("quickjs-setup.json");
    let stats;
    try {
        stats = await setup.stat();
    } catch (ex) {
        stats = null;
    }
    if (stats === null || Date.now() - stats.mtime.getTime() > 3600 * 1000) {
        const [version] = await latest();
        const filename = `quickjs-${version}.tar.gz`;
        await Bun.write(setup, JSON.stringify({ version, filename }));
        const url = `https://github.com/quickjs-ng/quickjs/archive/refs/tags/v${version}.tar.gz`;
        // const url = `https://github.com/quickjs-ng/quickjs/releases/download/openssl-${version}/openssl-${version}.tar.gz`;
        return { filename, url, version };
    } else {
        const { version, filename } = await setup.json();
        const url = `https://github.com/quickjs-ng/quickjs/archive/refs/tags/v${version}.tar.gz`;
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
        await wget(url, filename);
    }

    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    console.log("deflating ...");
    const srcDir = `quickjs-${version}`;
    if (!(await isDirectory(srcDir))) {
        await $`tar xf ${filename}`;
    }
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    if (os.platform() !== "darwin" && await isFile(`${CONFIG.serverDir}/compiler/bin/gcc`)) {
        $.env({
            ...process.env,
            CXX: `${CONFIG.serverDir}/compiler/bin/g++`,
            CC: `${CONFIG.serverDir}/compiler/bin/gcc`,
            LDFLAGS:
                `-Wl,-rpath,${CONFIG.serverDir}/compiler/lib64 -L${CONFIG.serverDir}/compiler/lib64`,
        });
    }
    const stageDir = `${srcDir}/stage`;
    await $`cd ${srcDir} && mkdir -p stage`;
    const installPrefix = `${CONFIG.vendorDir}/quickjs-${version}`;
    const cmakeCmd = `cd ${stageDir} && cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=${installPrefix} -DQJS_BUILD_LIBC=ON ../`;
    console.log(cmakeCmd);
    await $`${{ raw: cmakeCmd }}`;
    const makeCmd = `cd ${stageDir} && make -j${concurrency}`;
    await $`${{ raw: makeCmd }}`;
    const installCmd = `cd ${stageDir} && make install`;
    await $`${{ raw: installCmd }}`;
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
    const srcDir = `quickjs-${version}`;
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
