#! ~/.bun/bin/bun

/**
 * Golang installation/update script.
 *
 * 1. Fetch https://golang.google.cn/dl/ and match `go\d+\.\d+\.\d+` to detect
 *    the latest release. Result is cached in `compiler-golang.json` for 1h.
 * 2. Compose the archive URL for the current platform/arch (e.g.
 *    `https://golang.google.cn/dl/go1.26.4.linux-amd64.tar.gz`) and download
 *    it to /data/stage.
 * 3. Extract -> /data/stage/go, then move/rename to
 *    /data/server/go-MAJOR.MINOR (PATCH is ignored).
 * 4. Refresh the symlink /data/server/go -> /data/server/go-MAJOR.MINOR.
 */

import { $, semver } from "bun";
import os from "node:os";
import fs from "node:fs/promises";

const CONFIG = {
    serverDir: process.env.SERVER_DIR || "/data/server",
    stageDir: process.env.STAGE_DIR || "/data/stage",
    mirror: process.env.GO_MIRROR || "https://golang.google.cn/dl",
    link: "go",
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

// Pull the latest go release version (full MAJOR.MINOR.PATCH) from the
// official download index page.
async function latest() {
    const vregex = /go(\d+\.\d+\.\d+)/g;
    let version = "1.0.0";
    const rsp = await fetch(`${CONFIG.mirror}/`, {
        headers: {
            "user-agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
        },
    });
    const data = await rsp.text();
    let m;
    while ((m = vregex.exec(data)) !== null) {
        if (semver.order(version, m[1]) < 0) {
            version = m[1];
        }
    }
    return version;
}

// Map node's platform/arch to the suffix used by golang.org archive names.
function suffix() {
    const platform = os.platform(); // 'darwin' | 'linux' | ...
    const archMap = {
        x64: "amd64",
        arm64: "arm64",
        arm: "armv6l",
        ia32: "386",
        ppc64: "ppc64le",
        s390x: "s390x",
    };
    const arch = archMap[os.arch()] || os.arch();
    return `${platform}-${arch}`;
}

async function setup() {
    const file = Bun.file("compiler-golang.json");
    let stat = null;
    try {
        stat = await file.stat();
    } catch (ex) {
        stat = null;
    }

    const arch = suffix();
    if (stat == null || Date.now() - stat.mtime.getTime() > 3600 * 1000) {
        const version = await latest();
        const filename = `go${version}.${arch}.tar.gz`;
        await Bun.write(file, JSON.stringify({ filename, version, arch }));
        return { filename, version, arch };
    } else {
        const cached = await file.json();
        // If arch differs from cache (e.g. moved between machines), rebuild.
        if (cached.arch !== arch) {
            const version = await latest();
            const filename = `go${version}.${arch}.tar.gz`;
            await Bun.write(file, JSON.stringify({ filename, version, arch }));
            return { filename, version, arch };
        }
        return cached;
    }
}

async function build() {
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    const { filename, version, arch } = await setup();
    const [major, minor /*, patch*/] = version.split(".");
    const shortVersion = `${major}.${minor}`;
    const targetDir = `${CONFIG.serverDir}/go-${shortVersion}`;
    const linkPath = `${CONFIG.serverDir}/${CONFIG.link}`;
    const url = `${CONFIG.mirror}/${filename}`;
    const archivePath = `${CONFIG.stageDir}/${filename}`;
    const extractedDir = `${CONFIG.stageDir}/go`;

    console.log(`version: ${version} (short: ${shortVersion})`);
    console.log(`arch:    ${arch}`);
    console.log(`archive: ${filename}`);
    console.log(`url:     ${url}`);
    console.log(`target:  ${targetDir}`);
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );

    // Make sure /data/stage exists.
    await $`mkdir -p ${CONFIG.stageDir}`;
    await $`mkdir -p ${CONFIG.serverDir}`;

    // 1. download
    if (await isFile(archivePath)) {
        console.log("archive already exists, skip downloading.");
    } else {
        const downloadCmd = `cd ${CONFIG.stageDir} && wget --quiet --show-progress --progress=bar:force:noscroll -O ${filename} ${url}`;
        console.log(downloadCmd);
        await $`${{ raw: downloadCmd }}`;
    }

    // 2. extract
    // Clean any leftover /data/stage/go from previous run.
    if (await isDirectory(extractedDir)) {
        await $`rm -rf ${extractedDir}`;
    }
    console.log("deflating ...");
    const tarCmd = `cd ${CONFIG.stageDir} && tar -xzf ${filename}`;
    await $`${{ raw: tarCmd }}`;

    if (!(await isDirectory(extractedDir))) {
        throw new Error(
            `expected ${extractedDir} after extraction but not found`,
        );
    }

    // 3. rename/move to /data/server/go-X.XX
    console.log(`moving ${extractedDir} -> ${targetDir} ...`);
    await $`rm -rf ${targetDir}`;
    await $`mv ${extractedDir} ${targetDir}`;

    // 4. refresh symlink /data/server/go -> /data/server/go-X.XX
    console.log(`updating symlink ${linkPath} -> ${targetDir} ...`);
    await $`ln -snf ${targetDir} ${linkPath}`;

    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    console.log(`done. ${linkPath} -> ${targetDir}`);
}

async function clean() {
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    console.log("cleaning up ...");
    const { filename } = await setup();
    const archivePath = `${CONFIG.stageDir}/${filename}`;
    const extractedDir = `${CONFIG.stageDir}/go`;
    await $`rm -rf ${archivePath}`;
    await $`rm -rf ${extractedDir}`;
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );
    console.log("done.");
}

if (process.argv[2] === "version") {
    console.log(await latest());
} else if (process.argv[2] === "clean") {
    await clean();
} else {
    await build();
}
