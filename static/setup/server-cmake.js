#! ~/.bun/bin/bun

/**
 * CMake installation/update script.
 *
 * 1. Fetch https://github.com/Kitware/CMake/releases/latest/ and match the
 *    release title (e.g. `v4.4.3`) to detect the latest release. Result is
 *    cached in `server-cmake.json` for 1h.
 * 2. Compose the prebuilt binary archive URL for the current platform/arch
 *    (e.g. `cmake-4.4.3-linux-x86_64.tar.gz`) and download it to /data/stage
 *    through the GitHub mirror.
 * 3. Extract -> /data/stage/cmake-VERSION-PLATFORM, then move/rename to
 *    /data/server/cmake-MAJOR.MINOR (PATCH is ignored).
 * 4. Refresh the symlink /data/server/cmake -> /data/server/cmake-MAJOR.MINOR.
 */

import { $ } from "bun";
import os from "node:os";
import fs from "node:fs/promises";

const CONFIG = {
    serverDir: process.env.SERVER_DIR || "/data/server",
    stageDir: process.env.STAGE_DIR || "/data/stage",
    mirror: "https://gh-proxy.com/", // GitHub Release 代理加速地址
    link: "cmake",
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

// Map node's platform/arch to the suffix used by CMake binary archive names.
function suffix() {
    const platform = os.platform(); // 'darwin' | 'linux' | ...
    if (platform === "darwin") {
        // CMake 仅发布 macos-universal 二进制包
        return "macos-universal";
    }
    const archMap = {
        x64: "x86_64",
        arm64: "aarch64",
    };
    const arch = archMap[os.arch()];
    if (platform !== "linux" || !arch) {
        throw new Error(`unsupported platform: ${platform}-${os.arch()}`);
    }
    return `${platform}-${arch}`;
}

// Pull the latest CMake release version (full MAJOR.MINOR.PATCH) from the
// GitHub release page.
async function latest() {
    const html = await (
        await fetch(`https://github.com/Kitware/CMake/releases/latest/`)
    ).text();
    const match = /<h1 [^>]+>v?([0-9][^<\s]*)/.exec(html);
    if (match === null) {
        throw new Error("unable to detect the latest CMake version.");
    }
    return match[1];
}

async function setup() {
    const file = Bun.file("server-cmake.json");
    let stat = null;
    try {
        stat = await file.stat();
    } catch (ex) {
        stat = null;
    }

    const arch = suffix();
    if (stat == null || Date.now() - stat.mtime.getTime() > 3600 * 1000) {
        const version = await latest();
        const filename = `cmake-${version}-${arch}.tar.gz`;
        await Bun.write(file, JSON.stringify({ filename, version, arch }));
        return { filename, version, arch };
    } else {
        const cached = await file.json();
        // If arch differs from cache (e.g. moved between machines), rebuild.
        if (cached.arch !== arch) {
            const version = await latest();
            const filename = `cmake-${version}-${arch}.tar.gz`;
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
    const targetDir = `${CONFIG.serverDir}/cmake-${shortVersion}`;
    const linkPath = `${CONFIG.serverDir}/${CONFIG.link}`;
    const url = `${CONFIG.mirror}https://github.com/Kitware/CMake/releases/download/v${version}/${filename}`;
    const archivePath = `${CONFIG.stageDir}/${filename}`;
    const extractedDir = `${CONFIG.stageDir}/cmake-${version}-${arch}`;

    console.log(`version: ${version} (short: ${shortVersion})`);
    console.log(`arch:    ${arch}`);
    console.log(`archive: ${filename}`);
    console.log(`url:     ${url}`);
    console.log(`target:  ${targetDir}`);
    console.log(
        "--------------------------------------------------------------------------------------------------",
    );

    // Make sure /data/stage and /data/server exist.
    await $`mkdir -p ${CONFIG.stageDir}`;
    await $`mkdir -p ${CONFIG.serverDir}`;

    // Skip downloading/extracting when the target version is already installed.
    if (await isDirectory(targetDir)) {
        console.log(`target already exists: ${targetDir}, skip downloading.`);
    } else {
        // 1. download
        if (await isFile(archivePath)) {
            console.log("archive already exists, skip downloading.");
        } else {
            const downloadCmd = `cd ${CONFIG.stageDir} && wget --quiet --show-progress --progress=bar:force:noscroll -O ${filename} ${url}`;
            console.log(downloadCmd);
            await $`${{ raw: downloadCmd }}`;
        }

        // 2. extract
        // Clean any leftover extraction from previous run.
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

        // 3. rename/move to /data/server/cmake-X.XX
        console.log(`moving ${extractedDir} -> ${targetDir} ...`);
        await $`rm -rf ${targetDir}`;
        await $`mv ${extractedDir} ${targetDir}`;
    }

    // 4. refresh symlink /data/server/cmake -> /data/server/cmake-X.XX
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
    const { filename, version, arch } = await setup();
    await $`rm -rf ${CONFIG.stageDir}/${filename}`;
    await $`rm -rf ${CONFIG.stageDir}/cmake-${version}-${arch}`;
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
