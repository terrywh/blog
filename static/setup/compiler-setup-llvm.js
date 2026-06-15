#! ~/.bun/bin/bun

import { $, semver } from "bun";
import os from "node:os";
import fs from "node:fs/promises";

const concurrency = Math.trunc((os.cpus().length * 3) / 4);

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
        await fetch(`https://github.com/llvm/llvm-project/releases/latest/`)
    ).text();
    const match = /<h1 [^>]+>LLVM ([^<]+)<\/h1>/.exec(html);
    return [match[1]];
}

async function setup() {
    const setup = Bun.file("compiler-setup-llvm.json");
    let stats;
    try {
        stats = await setup.stat();
    } catch (ex) {
        stats = null;
    }
    if (stats === null || Date.now() - stats.mtime.getTime() > 3600 * 1000) {
        const [version] = await latest();
        const filename = `llvm-project-${version}.src.tar.xz`;
        await Bun.write(setup, JSON.stringify({ version, filename }));
        const url = `https://github.com/llvm/llvm-project/releases/download/llvmorg-${version}/llvm-project-${version}.src.tar.xz`;
        return { filename, url, version };
    } else {
        const { version, filename } = await setup.json();
        const url = `https://github.com/llvm/llvm-project/releases/download/llvmorg-${version}/llvm-project-${version}.src.tar.xz`;
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
    if (!(await isDirectory(`llvm-project-${version}.src`))) {
        await $`tar xf ${filename}`;
    }
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    if (await isFile("/data/server/compiler/bin/gcc")) {
        $.env({
            ...process.env,
            CXX: "/data/server/compiler/bin/g++",
            CC: "/data/server/compiler/bin/gcc",
            LDFLAGS:
                "-Wl,-rpath,/data/server/compiler/lib64 -L/data/server/compiler/lib64",
        });
    }
    await $`cd llvm-project-${version}.src && cmake -G Ninja -B stage -S llvm -Wno-dev -DLLVM_ENABLE_RTTI=ON -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/data/server/compiler -DLLVM_ENABLE_PROJECTS="clang;clang-tools-extra;lld;lldb;polly" -DLLVM_ENABLE_RUNTIMES="all"`;
    await $`cd llvm-project-${version}.src && ninja -C stage -j${concurrency}`;
    await $`cd llvm-project-${version}.src && ninja -C stage install`;
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
    await $`rm -rf ${filename}`;
    await $`rm -rf llvm-project-${version}.src`;
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
