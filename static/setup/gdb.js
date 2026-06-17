#! ~/.bun/bin/bun

import { $ } from "bun";
import os from "node:os";
import fs from "node:fs/promises";

const concurrency = Math.trunc((os.cpus().length * 3) / 4);

// Directory configuration (can be overridden via environment variables)
const CONFIG = {
    serverDir: process.env.SERVER_DIR || "/data/server",
    gnuMirror: process.env.GNU_MIRROR || "https://mirrors.tuna.tsinghua.edu.cn/gnu",
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
    await $`wget --quiet --show-progress --progress=bar:force:noscroll -O ${filename} ${url}`;
}

async function latest() {
    const html = await (
        await fetch("https://sourceware.org/gdb/")
    ).text();
    const match = html.match(/version (\d+\.\d+)/);
    return match[1];
}

async function setup() {
    const setup = Bun.file("gdb-setup.json");
    let stats;
    try {
        stats = await setup.stat();
    } catch (ex) {
        stats = null;
    }
    if (stats === null || Date.now() - stats.mtime.getTime() > 3600 * 1000) {
        const version = await latest();
        const filename = `gdb-${version}.tar.xz`;
        await Bun.write(setup, JSON.stringify({ version, filename }));
        const url = `${CONFIG.gnuMirror}/gdb/${filename}`;
        return { filename, url, version };
    } else {
        const { version, filename } = await setup.json();
        const url = `${CONFIG.gnuMirror}/gdb/${filename}`;
        return { filename, url, version };
    }
}

async function build() {
    console.log("------------------------------------------------");
    await $`yum install -y python3-devel gmp-devel mpfr-devel ncurses-devel`;

    console.log("------------------------------------------------");
    const { filename, url, version } = await setup();
    console.log(filename);
    console.log("------------------------------------------------");
    if (await isFile(filename)) {
        console.log("already exists.");
    } else {
        await wget(url, filename);
    }

    console.log("------------------------------------------------");
    console.log("deflating ...");
    if (!(await isDirectory(`gdb-${version}`))) {
        await $`tar xf ${filename}`;
    }

    console.log("------------------------------------------------");
    console.log("staging ...");
    await $`rm -rf gdb-${version}/stage && mkdir gdb-${version}/stage`;

    console.log("------------------------------------------------");
    $.env({
        ...process.env,
        CC:  `${CONFIG.serverDir}/compiler/bin/gcc`,
        CXX: `${CONFIG.serverDir}/compiler/bin/g++`,
    });
    console.log(`../configure --prefix=${CONFIG.serverDir}/compiler --with-python=/usr/bin/python3`);
    await $`cd gdb-${version}/stage && ../configure --prefix=${CONFIG.serverDir}/compiler --with-python=/usr/bin/python3`;

    console.log("------------------------------------------------");
    await $`cd gdb-${version}/stage && make -j${concurrency} && make install`;
    console.log("------------------------------------------------");
    console.log("done.");
}

async function clean() {
    console.log("------------------------------------------------");
    console.log("cleaning up ...");
    const { filename, version } = await setup();
    await $`rm -rf ${filename}`;
    await $`rm -rf gdb-${version}`;
    console.log("------------------------------------------------");
    console.log("done.");
}

if (process.argv[2] === "clean") {
    await clean();
} else {
    await build();
}
