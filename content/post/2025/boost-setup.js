#! ~/.bun/bin/bun

import { $, semver } from "bun";
import os from "node:os";
import fs from "node:fs/promises";

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
        await fetch(`https://www.boost.org/releases/latest/`)
    ).text();
    const match1 = /http:\/\/www\.boost\.org\/doc\/libs\/([^<\s\b"]+)/.exec(
        html,
    );
    const match2 =
        /github\.com\/boostorg\/boost\/releases\/tag\/boost-([^<\s\b"]+)/.exec(
            html,
        );
    return [match1[1], match2[1]];
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
        const [fversion, uversion] = await latest();
        await Bun.write(setup, JSON.stringify({ fversion, uversion }));
        const filename = `boost_${fversion}.tar.bz2`;
        const url = `https://archives.boost.io/release/${uversion}/source/${filename}`;

        return { filename, url, fversion, uversion };
    } else {
        const { fversion, uversion } = await setup.json();
        const filename = `boost_${fversion}.tar.bz2`;
        const url = `https://archives.boost.io/release/${uversion}/source/${filename}`;
        return { filename, url, fversion, uversion };
    }
}

async function build() {
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    const { filename, url, fversion, uversion } = await setup();
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
    if (!(await isDirectory(`boost_${fversion}`))) {
        await $`tar xf ${filename}`;
    }
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    await $`cd boost_${fversion} && ./bootstrap.sh --prefix=/data/vendor/boost-${uversion}`;
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    await $`cd boost_${fversion} && ./b2 --prefix=/data/vendor/boost-${uversion} cxxflags="-fPIC" variant=release link=static threading=multi install`;
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
    const { filename, url, fversion, uversion } = await setup();
    await $`rm -rf ${filename}`;
    await $`rm -rf boost_${fversion}`;
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
