#! ~/.bun/bin/bun

import { $, semver } from "bun";
import os from "node:os";
import fs from "node:fs/promises";

const concurrency = Math.trunc((os.cpus().length * 3) / 4);
const gnumirror = "https://mirrors.ustc.edu.cn/gnu";

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

async function latest() {
    const vregex = /gcc-(\d+\.\d+\.\d+)/;
    let version = "1.0.0";
    const rsp = await fetch(`${gnumirror}/gcc/`);
    for (let line of (await rsp.text()).split("\n")) {
        const r = vregex.exec(line);
        if (r && semver.order(version, r[1]) < 0) {
            version = r[1];
        }
    }
    return version;
}

function dependency(s) {
    const vregex = /([^=]+)='([^']+)'?/;
    const r = vregex.exec(s);
    return r ? [r[1], r[2]] : [null, null];
}

async function build() {
    console.log("------------------------------------------------");
    await $`yum install -y doxygen libxml2-devel swig python3-devel cmake ninja-build`;

    console.log("------------------------------------------------");
    const { filename, version } = await setup();
    console.log(filename);
    console.log("------------------------------------------------");
    if (await Bun.file(filename).exists()) {
        console.log("package already exists.");
    } else {
        await $`wget --quiet --show-progress --progress=bar:force:noscroll -O ${filename} ${gnumirror}/gcc/gcc-${version}/${filename}`;
    }

    console.log("------------------------------------------------");
    if (await isDirectory(`gcc-${version}`)) {
        console.log("package already deflated.");
    } else {
        console.log("deflating ...");
        await $`tar xf ${filename}`;
    }

    console.log("------------------------------------------------");
    console.log("preparing prerequisites ...");

    const deps = await Bun.file(
        `gcc-${version}/contrib/download_prerequisites`,
    ).text();
    for (let line of deps.split("\n")) {
        if (
            line.endsWith(".tar.gz'") ||
            line.endsWith(".tar.bz2'") ||
            line.endsWith(".tar.xz'")
        ) {
            let [name, file] = dependency(line);
            if (!name) continue;

            if (await isFile(`gcc-${version}/${file}`)) {
                console.log("dependency exists:", file);
                continue;
            }

            if (name == "isl") {
                await $`wget --quiet --show-progress --progress=bar:force:noscroll -O gcc-${version}/${file} https://libisl.sourceforge.io/${file}`;
            } else {
                await $`wget --quiet --show-progress --progress=bar:force:noscroll -O gcc-${version}/${file} ${gnumirror}/${name}/${file}`;
            }
        }
    }

    await $`cd gcc-${version}; ./contrib/download_prerequisites`;
    console.log("------------------------------------------------");
    console.log("staging ...");
    await $`rm -rf gcc-${version}/stage && mkdir gcc-${version}/stage`;

    console.log("------------------------------------------------");
    let conf = await $`/usr/bin/gcc -v 2>&1 | grep ../configure`.text();
    conf = conf.split("../configure").pop().split(" --");

    const ignore_prefix = [
        "with-pkgversion=",
        "mandir=",
        "infodir=",
        "with-bugurl=",
        "disable-libunwind-exceptions",
        "build=",
        "without-isl",
    ];

    let rst = ["../configure"];
    for (let entry of conf) {
        if (entry.startsWith("enable-languages=")) {
            rst.push("enable-languages=c,c++,lto");
        } else if (entry.startsWith("prefix=")) {
            rst.push("prefix=/data/server/compiler");
        } else if (ignore_prefix.some((p) => entry.startsWith(p))) {
            // ignore
        } else {
            rst.push(entry.trim());
        }
    }
    rst = rst.filter((v) => v.length > 0);
    rst = rst.join(" --");
    console.log(rst);
    console.log("------------------------------------------------");
    await $`cd gcc-${version}/stage && ${{ raw: rst }}`;
    console.log("------------------------------------------------");
    await $`cd gcc-${version}/stage && make -j${concurrency} && make install`;
    console.log("------------------------------------------------");
    console.log("done.");
}

async function setup() {
    const file = Bun.file("compiler-setup-gcc.json");
    let stat = null;
    try {
        const stat = await file.stat();
    } catch (ex) {
        stat = null;
    }

    if (stat == null || Date.now() - stat.mtime.getTime() > 3600 * 1000) {
        const version = await latest();
        const filename = `gcc-${version}.tar.xz`;
        await Bun.write(file, { filename, version });
        return { filename, version };
    } else {
        return await file.json();
    }
}

async function clean() {
    const { filename, version } = await setup();
    console.log("------------------------------------------------");
    console.log("cleaning up ...");
    await $`rm -rf ${filename}`;
    await $`rm -rf gcc-${version}`;
    console.log("------------------------------------------------");
    console.log("done.");
}

if (process.argv[2] === "clean") {
    await clean();
} else {
    await build();
}
