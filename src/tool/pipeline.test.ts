import { describe, expect, it } from 'vitest';
import { MODEL_SIZE } from './core';
import { computeMask, type Infer } from './pipeline';

const N = MODEL_SIZE;
/** 假模型：中心圆内给大正数、圆外给大负数，同时记录收到的输入 */
function fakeModel() {
  let seen: Float32Array | null = null;
  const infer: Infer = async (input) => {
    seen = input;
    const out = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) out[y * N + x] = Math.hypot(x - N / 2, y - N / 2) < N / 4 ? 12 : -12;
    return out;
  };
  return { infer, input: () => seen };
}
const gray = (w: number, h: number, v = 128) => new Uint8ClampedArray(w * h * 4).fill(v);

describe('蒙版流水线（假模型）', () => {
  it('输入形状是 1×3×512×512，输出放大到工作分辨率', async () => {
    const f = fakeModel();
    const m = await computeMask(gray(N, N), gray(1024, 768), 1024, 768, f.infer, { refine: false, feather: 0 });
    expect(f.input()!.length).toBe(3 * N * N);
    expect(m.length).toBe(1024 * 768);
    expect(m[384 * 1024 + 512]).toBeGreaterThan(0.99); // 中心是主体
    expect(m[5 * 1024 + 5]).toBeLessThan(0.01); // 角落是背景
  });
  it('开启精修和羽化后仍在 0–1 内，中心与角落的判断不变', async () => {
    const m = await computeMask(gray(N, N), gray(600, 600), 600, 600, fakeModel().infer, { refine: true, feather: 2 });
    expect([...m].every((v) => v >= 0 && v <= 1)).toBe(true);
    expect(m[300 * 600 + 300]).toBeGreaterThan(0.9);
    expect(m[3 * 600 + 3]).toBeLessThan(0.1);
  });
  it('模型输出大小不对时报清楚的错', async () => {
    await expect(computeMask(gray(N, N), gray(64, 64), 64, 64, async () => new Float32Array(10), { refine: false, feather: 0 })).rejects.toThrow('模型输出大小不对');
  });
});
