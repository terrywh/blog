#! ~/.bun/bin/bun

import { $ } from "bun";
import fs from "node:fs/promises";

// Directory configuration (can be overridden via environment variables)
const CONFIG = {
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
        const stat = await fs.stat(path);
        return stat.isFile() && stat.size > 0;
    } catch (ex) {
        return false;
    }
}

async function wget(url, filename) {
    console.log(arguments);
    // URL和filename都已提前拼接好，直接使用单个插值
    await $`wget --quiet --show-progress --progress=bar:force:noscroll -O ${filename} ${url}`;
}

async function latest() {
    const html = await (
        await fetch(`https://www.boost.org/releases/latest/`)
    ).text();
    const match =
        /https:\/\/archives\.boost\.io\/release\/([^/]+)\/source\/boost_([^\.]+)\.tar\.bz2/.exec(
            html,
        );
    return [match[1], match[0]];
}

async function setup() {
    const setup = Bun.file("boost-setup.json");
    let stats;
    try {
        stats = await setup.stat();
    } catch (ex) {
        stats = null;
    }
    if (stats === null || Date.now() - stats.mtime.getTime() > 3600 * 1000) {
        const [version, url] = await latest();
        await Bun.write(setup, JSON.stringify({ version, url }));
        const filename = `boost_${version}.tar.bz2`;

        return { version, filename, url };
    } else {
        const { version, url } = await setup.json();
        const filename = `boost_${version}.tar.bz2`;
        return { version, filename, url };
    }
}

async function build() {
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    const { filename, url, version } = await setup();
    console.log(filename, url);
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
    const srcDir = `boost_${version.replace(/\./g, "_")}`;
    if (!(await isDirectory(srcDir))) {
        await $`tar xf ${filename}`;
    }
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    const prefix = `${CONFIG.vendorDir}/boost-${version.split(".").slice(0, -1).join(".")}`;
    await $`cd ${srcDir} && ./bootstrap.sh --prefix=${prefix}`;
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    const b2Cmd = `cd ${srcDir} && ./b2 --prefix=${prefix} cxxflags="-fPIC" variant=release link=static threading=multi install`;
    await $`${{ raw: b2Cmd }}`;
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
    const { filename, url, version } = await setup();
    const srcDir = `boost_${version.replace(/\./g, "_")}`;
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
