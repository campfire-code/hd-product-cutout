// 抠图流程：在应用内用 onnxruntime-web（WASM，单线程）跑 BiRefNet lite 512 模型，离线可用（模型首次使用时下载一次）。
import * as ort from 'onnxruntime-web/wasm';
import { appDataDir, join } from '@tauri-apps/api/path';
import { exists, mkdir, readFile, writeFile } from '@tauri-apps/plugin-fs';
import { httpFetch } from '../kit/platform';
import { MODEL_SIZE, alphaBox, applyAlpha, compositeOnColor, fitWithin, hexToRgb, placeSquare, resizeBilinear, toAlpha8 } from './core';
import { MODEL, loadModelBytes, sha256Hex, type ModelDeps } from './model';
import { computeMask } from './pipeline';
import wasmUrl from '../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm?url';
import mjsUrl from '../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs?url';

// 推理引擎文件随应用打包，离线可用
ort.env.wasm.wasmPaths = { wasm: wasmUrl, mjs: mjsUrl };
ort.env.wasm.numThreads = 1;

/** 工作分辨率的长边上限：蒙版精修在这个尺寸上做，最后再放大到原图 */
const WORK_MAX = 2048;
const MAX_PIXELS = 100_000_000;

const deps: ModelDeps = {
  fetch: (url, init) => httpFetch(url, { method: 'GET', signal: init.signal }) as unknown as ReturnType<ModelDeps['fetch']>,
  read: async (p) => ((await exists(p)) ? readFile(p) : null),
  write: async (p, d) => {
    await mkdir(p.replace(/[\\/][^\\/]+$/, ''), { recursive: true });
    await writeFile(p, d);
  },
  sha256: sha256Hex,
};

let session: Promise<ort.InferenceSession> | null = null;
let sessionKey = '';
/** localPath 为空则用缓存 / 下载；换了本地文件会重新加载 */
export function getSession(localPath: string, onDownload: (r: number) => void, signal?: AbortSignal) {
  if (session && sessionKey !== localPath) session = null;
  sessionKey = localPath;
  return (session ??= (async () => {
    const cache = await join(await appDataDir(), 'models', MODEL.file);
    const bytes = await loadModelBytes(deps, cache, { localPath: localPath || undefined, onDownload, signal });
    try {
      return await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
    } catch (e) {
      throw new Error(`抠图模型加载失败：${e instanceof Error ? e.message : e}`);
    }
  })().catch((e) => {
    session = null;
    throw e;
  }));
}

async function decode(bytes: Uint8Array): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart]));
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch {
    throw new Error('无法识别这张图片，可能已损坏或格式不受支持');
  } finally {
    URL.revokeObjectURL(url);
  }
  return img;
}

const canvas = (w: number, h: number) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const pixels = (img: CanvasImageSource, w: number, h: number) => {
  const c = canvas(w, h);
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, w, h);
  return g.getImageData(0, 0, w, h).data;
};

export interface RemoveOptions {
  /** 背景颜色，null 表示透明 */
  background: string | null;
  /** 输出方形边长，0 表示保持原图尺寸 */
  size: number;
  marginPct: number;
  refine: boolean;
  feather: number;
  mime: string;
  quality: number;
  /** 本地模型文件路径，空则自动下载 */
  modelFile: string;
}

export async function cutout(bytes: Uint8Array, opt: RemoveOptions, progress: (r: number) => void, signal?: AbortSignal) {
  const img = await decode(bytes);
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  if (Math.min(W, H) < 64) throw new Error(`图片太小（${W}×${H}），至少要 64 像素`);
  if (W * H > MAX_PIXELS) throw new Error(`图片太大（${W}×${H}），请先缩小到 1 亿像素以内`);
  // 模型加载 / 首次下载占 0–0.5
  const s = await getSession(opt.modelFile, (r) => progress(0.02 + r * 0.48), signal);
  progress(0.5);

  const { w: ww, h: wh } = fitWithin(W, H, WORK_MAX);
  const modelRgba = pixels(img, MODEL_SIZE, MODEL_SIZE);
  const workRgba = pixels(img, ww, wh);
  const mask = await computeMask(modelRgba, workRgba, ww, wh, async (input) => {
    const r = await s.run({ [s.inputNames[0]]: new ort.Tensor('float32', input, [1, 3, MODEL_SIZE, MODEL_SIZE]) });
    return r[s.outputNames[0]].data as Float32Array;
  }, { refine: opt.refine, feather: opt.feather });
  progress(0.8);

  // 蒙版放大到原图尺寸，写进原图的透明度通道
  let alpha = toAlpha8(mask);
  if (ww !== W || wh !== H) alpha = resizeBilinear(alpha, ww, wh, W, H);
  const full = canvas(W, H);
  const fg = full.getContext('2d', { willReadFrequently: true })!;
  fg.drawImage(img, 0, 0);
  const data = fg.getImageData(0, 0, W, H);
  applyAlpha(data.data, alpha);
  const box = alphaBox((i) => alpha[i], W, H);
  if (!box) throw new Error('没有识别到商品主体，可能整张图都是背景');
  if (opt.background) data.data.set(compositeOnColor(data.data, hexToRgb(opt.background)));
  fg.putImageData(data, 0, 0);
  progress(0.9);

  let out: HTMLCanvasElement;
  if (opt.size > 0) {
    out = canvas(opt.size, opt.size);
    const p = placeSquare(box, opt.size, opt.marginPct);
    const og = out.getContext('2d')!;
    if (opt.background) { og.fillStyle = opt.background; og.fillRect(0, 0, opt.size, opt.size); }
    og.imageSmoothingQuality = 'high';
    og.drawImage(full, box.x, box.y, box.w, box.h, p.x, p.y, p.w, p.h);
  } else out = full;
  const blob = await new Promise<Blob | null>((ok) => out.toBlob(ok, opt.mime, opt.mime === 'image/png' ? undefined : opt.quality / 100));
  if (!blob) throw new Error('编码失败，图片可能太大');
  progress(0.98);
  return { data: new Uint8Array(await blob.arrayBuffer()), width: out.width, height: out.height, box };
}
