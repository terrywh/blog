#! ~/.bun/bin/bun

/**
 * llama.cpp 更新、下载及版本管理脚本
 * 功能：自动获取最新版本，根据当前运行平台架构选择对应二进制包，并建立软链接。
 */

import { $ } from "bun";
import os from "node:os";
import fs from "node:fs/promises";

// 目录与路径配置
const CONFIG = {
    base: "/data/server", // 或 /data/server 根据你的实际环境修改
    link: "llama",
    repo: "ggml-org/llama.cpp",
    mirror: "https://gh-proxy.com/", // GitHub Release 代理加速地址
};

// 辅助：判断文件或目录是否存在并返回类型
async function getFileStatus(path) {
    try {
        const stats = await fs.stat(path);
        return stats.isDirectory() ? 'dir' : 'file';
    } catch (err) {
        return null; // 不存在或错误
    }
}

// 获取最新版本号（参考 openssl.js 的逻辑，这里使用 GitHub API 提高准确性）
async function getVersion() {
    const apiUrl = `https://api.github.com/repos/${CONFIG.repo}/releases/latest`;
    try {
        const rsp = await fetch(apiUrl, {
            headers: {
                "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
            }
        });
        if (!rsp.ok) throw new Error(`HTTP ${rsp.status}`);
        const json = await rsp.json();
        // llama.cpp 发布 tag 通常是 bXXXXX 格式
        return { version: json.tag_name };
    } catch (ex) {
        console.error("获取最新版本失败:", ex);
    }
}

// 根据当前环境推断下载链接后缀
async function getSuffix() {
    const platform = os.platform(); // darwin, linux, win32...
    const system = platform === 'darwin' ? 'macos' : platform === "linux" ? 'linux' : 'unknown';
    return `${system}-${os.arch()}`;
}

// 主逻辑：构建、下载、解压、建立软链接
async function build() {
    console.log("====================================================================");
    const { version } = await getVersion();
    const archSuffix = await getSuffix();

    // 文件名模式：llama-b9637-bin-macos-arm64.tar.gz
    const fileName = `llama-${version}-bin-${suffix}.tar.gz`;
    const extractDir = `${CONFIG.base}/llama-${version}`;
    const linkPath = `${CONFIG.base}/${CONFIG.link}`;

    // 组合 URL，使用镜像代理
    // API 返回的 tag_name 可能不带 v 或带 v，此处假设直接匹配文件名规则
    const downloadUrl = `${CONFIG.mirror}https://github.com/${CONFIG.repoOwner}/${CONFIG.repoName}/releases/download/${version}/${fileName}`;

    console.log(`目标版本: ${version}, 架构后缀: ${archSuffix}`);
    console.log(`下载文件: ${fileName}`);

    // 1. 检查是否已存在最新版本目录（跳过机制）
    const status = await getFileStatus(extractDir);
    if (status === 'dir') {
        console.log("目标版本目录已存在，跳过下载与解压。");
    } else {
        // 2. 下载
        console.log(`正在下载 ${fileName} ...`);
        try {
            await $`cd ${CONFIG.base} && wget -q --show-progress --progress=bar:force:noscroll -O ${fileName} ${downloadUrl}`;
        } catch (e) {
            console.error("下载失败:", e);
            return;
        }

        // 3. 解压
        const fileExist = await getFileStatus(`${CONFIG.base}/${fileName}`);
        if (fileExist === 'file') {
            console.log(`正在解压到 ${extractDir} ...`);
            try {
                // tar 命令自动创建目录并提取
                await $`cd ${CONFIG.base} && tar -xzf ${fileName}`;
            } catch (e) {
                console.error("解压失败:", e);
                return;
            }

            // 4. 清理压缩包
            try {
                await $`rm -f ${CONFIG.base}/${fileName}`;
            } catch (ignore) {}
        } else {
            throw new Error("下载文件丢失，执行失败");
        }
    }

    // 5. 建立软链接 (覆盖旧链)
    console.log(`正在更新软链接 -> ${linkPath} ...`);
    try {
        await $`ln -snf ${extractDir} ${linkPath}`;
        console.log("完成！");

        const linkExists = await getFileStatus(linkPath);
        if (linkExists) {
            // 简单的验证，看软链是否指向正确位置
            const linkStats = await fs.readlink(linkPath);
            if (linkStats === extractDir) {
                console.log(`✅ 软链接已更新指向: ${version}`);
            } else {
                console.warn("⚠️ 软链接可能未预期指向");
            }
        }
    } catch (e) {
        console.error("建立软链接失败:", e);
    }

    console.log("====================================================================");
}

// CLI 入口
if (process.argv[2] === "clean") {
    // 清理逻辑（可选，目前脚本主要是替换机制，不需要手动 clean）
    console.log("Clean not supported in this mode yet.");
} else {
    await build();
}
