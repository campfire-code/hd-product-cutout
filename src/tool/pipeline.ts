// 蒙版流水线（纯函数 + 注入的推理函数）：模型输入 → 推理 → 放大 → 引导滤波 → 收紧 → 羽化。
import { MODEL_SIZE, featherMask, guidedFilter, refineRadius, resizeBilinear, sigmoidMask, tightenMask, toGray, toInput } from './core';

export type Infer = (input: Float32Array) => Promise<Float32Array>;

export interface MaskOptions {
  /** 用原图做引导滤波，补回发丝等细边 */
  refine: boolean;
  /** 边缘羽化半径（像素，按工作分辨率） */
  feather: number;
}

/**
 * @param modelRgba 缩放到 512×512 的原图像素，送给模型
 * @param workRgba  工作分辨率（ww×wh）的原图像素，作为引导图
 * @returns ww×wh 的 0–1 蒙版
 */
export async function computeMask(
  modelRgba: Uint8ClampedArray, workRgba: Uint8ClampedArray, ww: number, wh: number, infer: Infer, opt: MaskOptions,
): Promise<Float32Array> {
  const logits = await infer(toInput(modelRgba));
  if (logits.length !== MODEL_SIZE * MODEL_SIZE) throw new Error(`模型输出大小不对（${logits.length}），模型文件可能不匹配`);
  let m = resizeBilinear(sigmoidMask(logits), MODEL_SIZE, MODEL_SIZE, ww, wh);
  if (opt.refine) {
    m = guidedFilter(toGray(workRgba, ww, wh), m, ww, wh, refineRadius(ww, wh), 1e-3);
    m = tightenMask(m);
  }
  // 羽化半径按工作分辨率给，最多 8 像素，避免把细边抹掉
  return featherMask(m, ww, wh, Math.min(8, opt.feather));
}

