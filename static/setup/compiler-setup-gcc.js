#! ~/.bun/bin/bun

import { $, semver } from "bun";
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
        const stat = await fs.stat(path);
        return stat.isFile() && stat.size > 0;
    } catch (ex) {
        return false;
    }
}

async function latest() {
    const vregex = /gcc-(\d+\.\d+\.\d+)/;
    let version = "16.1.0";
    const rsp = await fetch(`${CONFIG.gnuMirror}/gcc/`, {
        headers: {
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
        },
    });
    const data = await rsp.text();
    for (let line of data.split("\n")) {
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
    if (await isFile(filename)) {
        console.log("package already exists.");
    } else {
        await $`rm -f ${filename}`;
        const downloadCmd = `wget --quiet --show-progress --progress=bar:force:noscroll -O ${filename} ${CONFIG.gnuMirror}/gcc/gcc-${version}/${filename}`;
        console.log(downloadCmd);
        await $`${{raw: downloadCmd}}`;
    }

    console.log("------------------------------------------------");
    const srcDir = `gcc-${version}`;
    if (await isDirectory(srcDir)) {
        console.log("package already deflated.");
    } else {
        console.log("deflating ...");
        await $`tar xf ${filename}`;
    }

    console.log("------------------------------------------------");
    console.log("preparing prerequisites ...");

    const deps = await Bun.file(
        `${srcDir}/contrib/download_prerequisites`,
    ).text();
    for (let line of deps.split("\n")) {
        if (
            line.endsWith(".tar.gz'") ||
            line.endsWith(".tar.bz2'") ||
            line.endsWith(".tar.xz'")
        ) {
            let [name, file] = dependency(line);
            if (!name) continue;

            const depOutput = `${srcDir}/${file}`;
            if (await isFile(depOutput)) {
                console.log("dependency exists:", file);
                continue;
            }
            await $`rm -f ${depOutput}`;

            if (name == "isl") {
                const depUrl = `https://libisl.sourceforge.io/${file}`;
                const depCmd = `wget --quiet --show-progress --progress=bar:force:noscroll -O ${depOutput} ${depUrl}`;
                await $`${{raw: depCmd}}`;
            } else {
                const depUrl = `${CONFIG.gnuMirror}/${name}/${file}`;
                const depCmd = `wget --quiet --show-progress --progress=bar:force:noscroll -O ${depOutput} ${depUrl}`;
                await $`${{raw: depCmd}}`;
            }
        }
    }

    const downloadCmd = `cd ${srcDir}; ./contrib/download_prerequisites`;
    await $`${{ raw: downloadCmd }}`;
    console.log("------------------------------------------------");
    console.log("staging ...");
    const stageDir = `${srcDir}/stage`;
    const stageCmd = `rm -rf ${stageDir} && mkdir ${stageDir}`;
    await $`${{ raw: stageCmd }}`;

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
            rst.push(`prefix=${CONFIG.serverDir}/compiler`);
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
    const configureCmd = `cd ${stageDir} && ${rst}`;
    await $`${{ raw: configureCmd }}`;
    console.log("------------------------------------------------");
    const makeCmd = `cd ${stageDir} && make -j${concurrency} && make install`;
    await $`${{ raw: makeCmd }}`;
    console.log("------------------------------------------------");
    console.log("done.");
}

async function setup() {
    const file = Bun.file("compiler-setup-gcc.json");
    let stat = null;
    try {
        stat = await file.stat();
    } catch (ex) {
        stat = null;
    }

    if (stat == null || Date.now() - stat.mtime.getTime() > 3600 * 1000) {
        const version = await latest();
        const filename = `gcc-${version}.tar.xz`;
        await Bun.write(file, JSON.stringify({ filename, version }));
        return { filename, version };
    } else {
        return await file.json();
    }
}

async function clean() {
    const { filename, version } = await setup();
    const srcDir = `gcc-${version}`;
    console.log("------------------------------------------------");
    console.log("cleaning up ...");
    await $`rm -rf ${filename}`;
    await $`rm -rf ${srcDir}`;
    console.log("------------------------------------------------");
    console.log("done.");
}
if (process.argv[2] === "version") {
    console.log(await latest());
} else if (process.argv[2] === "clean") {
    await clean();
} else {
    await build();
}
