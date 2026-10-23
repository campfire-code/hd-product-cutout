// 工具声明：高清商品抠图
import { Scissors } from 'lucide-react';
import type { BatchTool } from '../kit/types';
import { normalizeColor, outName } from './core';
import { cutout } from './remove';

const MIME: Record<string, [string, string]> = { jpg: ['image/jpeg', 'jpg'], png: ['image/png', 'png'], webp: ['image/webp', 'webp'] };

const tool: BatchTool = {
  id: 'e04',
  name: '高清商品抠图',
  tagline: '用 BiRefNet 模型抠发丝、透明件等难抠的商品，批量输出透明 PNG，也可换白底或纯色底。图片只在本机处理，不上传。',
  icon: Scissors,
  category: '电商运营',
  type: 'media',
  mode: 'batch',
  resultView: 'list',
  concurrency: 1,
  accept: { label: '商品图', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] },
  params: [
    { key: 'bg', label: '背景', type: 'segment', options: [['transparent', '透明'], ['white', '纯白'], ['color', '其他颜色']], default: 'transparent' },
    { key: 'color', label: '背景颜色', type: 'text', default: '#F5F5F5', placeholder: '#F5F5F5', when: (p) => p.bg === 'color', help: '写颜色代码，例如浅灰 #F5F5F5' },
    { key: 'format', label: '输出格式', type: 'segment', options: [['png', 'PNG'], ['jpg', 'JPG'], ['webp', 'WebP']], default: 'png', when: (p) => p.bg !== 'transparent', help: '透明背景固定输出 PNG' },
    { key: 'size', label: '输出尺寸', type: 'select', options: [['0', '保持原图尺寸（推荐）'], ['800', '800 × 800'], ['1000', '1000 × 1000'], ['1200', '1200 × 1200'], ['1500', '1500 × 1500'], ['2000', '2000 × 2000']], default: '0', help: '选方形尺寸时，商品会自动居中排版' },
    { key: 'margin', label: '商品四周留白', type: 'number', default: 8, min: 0, max: 40, unit: '%', when: (p) => p.size !== '0' },
    { key: 'refine', label: '边缘精修（发丝）', type: 'toggle', default: true, help: '用原图细节收紧边缘，发丝更清楚；偶尔会让半透明的玻璃边缘变硬，可关掉对比' },
    { key: 'feather', label: '边缘羽化', type: 'number', default: 1, min: 0, max: 8, unit: '像素', help: '数字越大边缘越柔和，0 为最锐利' },
    { key: 'modelFile', label: '本地模型文件（可选）', type: 'file', extensions: ['onnx'], fileLabel: '模型文件', default: '', help: '默认第一次使用时自动下载约 183 MB 的模型。下载不了可手动下载 birefnet-lite-512 的 model.onnx，在这里选择' },
    { key: 'out', label: '保存到', type: 'folder', default: '' },
  ],
  async run(item, ctx) {
    const p = ctx.params;
    const transparent = p.bg === 'transparent';
    const background = transparent ? null : p.bg === 'color' ? normalizeColor(String(p.color)) : '#FFFFFF';
    if (!transparent && !background) throw new Error(`背景颜色「${p.color}」写法不对，请写成 #F5F5F5 这样的颜色代码`);
    const [mime, ext] = transparent ? MIME.png : MIME[String(p.format)] ?? MIME.png;
    const src = await ctx.readFile(item.path!);
    const r = await cutout(src, {
      background, size: Number(p.size), marginPct: Number(p.margin), refine: p.refine !== false, feather: Number(p.feather),
      mime, quality: 92, modelFile: String(p.modelFile ?? ''),
    }, ctx.progress, ctx.signal);
    const kind = transparent ? 'transparent' : p.bg === 'white' ? 'white' : 'color';
    const outputPath = await ctx.join(ctx.outputDir, outName(item.name, ext, kind));
    await ctx.writeFile(outputPath, r.data);
    return { outputPath, preview: outputPath, summary: `${r.width}×${r.height} · ${transparent ? '透明背景' : background === '#FFFFFF' ? '白底' : `背景 ${background}`}` };
  },
};

export default tool;
