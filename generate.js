import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const urls = [
    'https://raw.githubusercontent.com/NiREvil/vless/refs/heads/main/sub/nekobox-wg.txt',
    'https://proxy.v2gh.com/https://raw.githubusercontent.com/Pawdroid/Free-servers/main/sub',
    'https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/sub/sub_merge.txt',
    'https://proxypool.link/sip002/sub'
];

const adLink = 'https://www.xn--nly574e.biz/auth/register?code=zI7qvG2n';
const adImageUrl = 'https://www.gaofumei.net/wp-content/uploads/2026/01/05.png';
const adImageLocalName = '05.png';

async function downloadFile(url, dest) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
        throw new Error(`The URL returned a non-image content type: ${contentType}`);
    }
    const buffer = await res.arrayBuffer();
    await fs.writeFile(dest, Buffer.from(buffer));
}

function decodeBase64IfNeeded(text) {
    const trimmed = text.trim();
    try {
        // Basic check to see if it's potentially base64
        if (!/^[A-Za-z0-9+/=\s]+$/.test(trimmed)) {
            return trimmed;
        }
        const decoded = Buffer.from(trimmed, 'base64').toString('utf-8');
        // Validate if decoded text has proxy schemes
        if (/(vmess|vless|ss|ssr|trojan|hysteria2|hy2|wg):\/\//i.test(decoded)) {
            return decoded;
        }
        // Alternatively, if it decodes to multiple lines that look reasonably like config strings
        if (decoded.includes('\n') && decoded.length > trimmed.length * 0.5) {
            return decoded;
        }
    } catch (e) {
        // Fallback to original text if decode fails
    }
    return trimmed;
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

export async function generateSite() {
    const distDir = path.join(__dirname, 'dist');
    const publicDir = path.join(distDir, 'public');
    
    // Clean and create dist directories
    await fs.rm(distDir, { recursive: true, force: true });
    await fs.mkdir(distDir, { recursive: true });
    await fs.mkdir(publicDir, { recursive: true });

    let currentAdImageName = adImageLocalName;
    const localSourcePath = path.join(__dirname, 'public', adImageLocalName);
    const targetPath = path.join(publicDir, adImageLocalName);

    try {
        // 1. 优先检查本地是否存在 public/05.png
        await fs.access(localSourcePath);
        console.log('Found local ad image, copying to dist...');
        await fs.copyFile(localSourcePath, targetPath);
        console.log('Local ad image copied successfully.');
    } catch (err) {
        // 2. 如果本地不存在，则尝试从网络下载
        console.log('Local ad image not found. Downloading ad image from URL...');
        try {
            await downloadFile(adImageUrl, targetPath);
            console.log('Ad image downloaded successfully.');
        } catch (e) {
            console.warn('Could not download ad image:', e.message);
            console.log('Creating a fallback placeholder image...');
            // Create a simple SVG placeholder if download fails
            const svgPlaceholder = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="150" viewBox="0 0 600 150">
                <rect width="600" height="150" fill="#f1f5f9"/>
                <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#64748b">
                    广告图片加载失败 (原图404不存在)
                </text>
            </svg>`;
            currentAdImageName = adImageLocalName.replace('.png', '.svg');
            await fs.writeFile(path.join(publicDir, currentAdImageName), svgPlaceholder);
        }
    }

    let allLines = [];
    
    // Fetch and decode resources
    for (const url of urls) {
        console.log(`Fetching ${url}...`);
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const text = await res.text();
            const decoded = decodeBase64IfNeeded(text);
            const lines = decoded.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
            allLines.push(...lines);
            console.log(` -> Fetched ${lines.length} lines`);
        } catch (e) {
            console.error(`Error processing ${url}:`, e);
        }
    }

    // Deduplicate lines
    allLines = [...new Set(allLines)];
    console.log(`Total valid unique lines across all resources: ${allLines.length}`);

    const itemsPerPage = 10;
    const totalPages = Math.ceil(allLines.length / itemsPerPage);

    const sitemapLinks = [];

    // Generate HTML pages
    for (let page = 1; page <= totalPages; page++) {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = allLines.slice(start, end);

        let htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>免费节点资源聚合 - 第 ${page} 页</title>
    <style>
        :root { --primary: #2563eb; --bg: #f8fafc; --card: #ffffff; --text: #1e293b; --border: #e2e8f0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; background: var(--bg); color: var(--text); padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { text-align: center; margin-bottom: 30px; font-size: 1.8rem; color: var(--primary); }
        .item { background: var(--card); padding: 15px; margin-bottom: 12px; border-radius: 8px; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.05); word-break: break-all; font-family: ui-monospace, monospace; font-size: 0.9em; }
        .media-container { text-align: center; margin: 20px 0; padding: 10px; background: var(--card); border: 1px dashed #cbd5e1; border-radius: 8px; cursor: pointer; }
        .media-container img { max-width: 100%; height: auto; border-radius: 4px; }
        .media-container p { font-size: 0.8em; color: #64748b; margin-bottom: 5px; }
        .pagination { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 30px 0; }
        .pagination a { padding: 8px 16px; border: 1px solid var(--border); text-decoration: none; border-radius: 6px; background: var(--card); color: var(--text); font-size: 0.9em; transition: all 0.2s; }
        .pagination a:hover { background: var(--primary); color: white; border-color: var(--primary); }
        .pagination a.active { background: var(--primary); color: white; border-color: var(--primary); font-weight: bold; }
        .footer { margin-top: 40px; padding: 20px; background: var(--card); border-radius: 8px; border: 1px solid var(--border); text-align: center; }
        .footer h3 { font-size: 1.1em; margin-bottom: 15px; color: #475569; }
        .footer-links { display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; font-size: 0.9em; }
        .footer-links a { color: var(--primary); text-decoration: none; }
        .footer-links a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>免费节点资源聚合 (第 ${page}/${totalPages} 页)</h1>
        <div class="content">
`;

        let adCount = 0;
        for (let i = 0; i < pageItems.length; i++) {
            htmlContent += `            <div class="item">${escapeHtml(pageItems[i])}</div>\n`;
            
            // Insert ad every 4 items
            if ((i + 1) % 4 === 0) {
                htmlContent += `            <div class="media-container" onclick="window.open(atob('${Buffer.from('https://www.xn--nly574e.biz/auth/register?code=zI7qvG2n').toString('base64')}'), '_blank')">
                    <img src="./public/${currentAdImageName}" alt="Featured Content">
            </div>\n`;
                adCount++;
            }
        }
        
        htmlContent += `        </div>\n        <div class="pagination">\n`;

        // Pagination window
        let startPage = Math.max(1, page - 4);
        let endPage = Math.min(totalPages, page + 4);
        
        if (page > 1) {
            htmlContent += `            <a href="${page - 1 === 1 ? 'index.html' : `page${page - 1}.html`}">&laquo; 上一页</a>\n`;
        }
        if (startPage > 1) {
            htmlContent += `            <a href="index.html">1</a>\n`;
            if (startPage > 2) htmlContent += `            <span>...</span>\n`;
        }
        
        for (let p = startPage; p <= endPage; p++) {
            const pageName = p === 1 ? 'index.html' : `page${p}.html`;
            const activeClass = p === page ? 'class="active"' : '';
            htmlContent += `            <a href="${pageName}" ${activeClass}>${p}</a>\n`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) htmlContent += `            <span>...</span>\n`;
            htmlContent += `            <a href="page${totalPages}.html">${totalPages}</a>\n`;
        }
        if (page < totalPages) {
            htmlContent += `            <a href="page${page + 1}.html">下一页 &raquo;</a>\n`;
        }

        htmlContent += `        </div>\n`;

        // Footer sitemap A tags
        htmlContent += `        <div class="footer">\n            <h3>网站地图</h3>\n            <div class="footer-links">\n`;
        for (let p = 1; p <= totalPages; p++) {
            const pageName = p === 1 ? 'index.html' : `page${p}.html`;
            htmlContent += `                <a href="${pageName}">第 ${p} 页</a>\n`;
        }
        htmlContent += `                <a href="sitemap.xml" target="_blank">sitemap.xml</a>\n`;
        htmlContent += `            </div>\n        </div>\n    </div>\n</body>\n</html>`;

        const filename = page === 1 ? 'index.html' : `page${page}.html`;
        await fs.writeFile(path.join(distDir, filename), htmlContent);
        
        // Use relative URL for sitemap items
        sitemapLinks.push(filename);
    }

    // Generate sitemap.xml
    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    for (const link of sitemapLinks) {
        sitemapXml += `    <url>\n        <loc>${link}</loc>\n        <changefreq>daily</changefreq>\n    </url>\n`;
    }
    sitemapXml += `</urlset>`;
    
    await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemapXml);

    console.log('Build complete! Static files generated in ./dist directory.');
}

import { fileURLToPath as _fileURLToPath } from 'url';
const _filename = _fileURLToPath(import.meta.url);
if (process.argv[1] === _filename) {
    generateSite().catch(console.error);
}
