// 截图与预览用的示例数据（不会进入正式运行）。图形全部是程序画的示例，不含真实商品或品牌。
import type { Row } from '../kit/runner';

type Kind = 'cup' | 'bottle' | 'fluff' | 'lamp';
const KINDS: [string, Kind, number][] = [
  ['保温杯-蓝.jpg', 'cup', 205], ['玻璃香水瓶.jpg', 'bottle', 175], ['毛绒球挂件.png', 'fluff', 20], ['护眼台灯.jpg', 'lamp', 45],
  ['陶瓷水杯套装.jpg', 'cup', 330], ['磨砂香水瓶.jpg', 'bottle', 280], ['羊毛线团.png', 'fluff', 350], ['旧图-缩略.jpg', 'cup', 0],
];

function draw(kind: Kind, hue: number, bg: 'busy' | 'check') {
  const S = 220;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  if (bg === 'busy') {
    const grd = g.createLinearGradient(0, 0, S, S);
    grd.addColorStop(0, `hsl(${(hue + 40) % 360} 28% 58%)`); grd.addColorStop(1, `hsl(${(hue + 100) % 360} 22% 34%)`);
    g.fillStyle = grd; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 40; i++) { g.fillStyle = `hsla(${(i * 47) % 360} 30% 70% / .18)`; g.fillRect((i * 53) % S, (i * 29) % S, 26, 26); }
  }
  g.save();
  if (kind === 'cup') {
    g.fillStyle = `hsl(${hue} 55% 42%)`; g.beginPath(); g.roundRect(72, 44, 76, 132, [14, 14, 22, 22]); g.fill();
    g.fillStyle = `hsl(${hue} 30% 82%)`; g.fillRect(76, 34, 68, 14);
    g.strokeStyle = `hsl(${hue} 55% 42%)`; g.lineWidth = 9; g.beginPath(); g.arc(150, 100, 24, -Math.PI / 2, Math.PI / 2); g.stroke();
  } else if (kind === 'bottle') {
    g.fillStyle = `hsla(${hue} 50% 80% / .55)`; g.strokeStyle = `hsl(${hue} 35% 92%)`; g.lineWidth = 4;
    g.beginPath(); g.roundRect(78, 84, 64, 96, 20); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(100, 44, 20, 44, 5); g.fill(); g.stroke();
    g.fillStyle = `hsl(${hue} 40% 38%)`; g.fillRect(97, 34, 26, 14);
  } else if (kind === 'fluff') {
    g.strokeStyle = `hsl(${hue} 60% 62%)`; g.lineWidth = 1.6;
    for (let i = 0; i < 260; i++) { const a = i * 2.399, r1 = 40, r2 = 58 + (i % 7) * 4; g.beginPath(); g.moveTo(110 + Math.cos(a) * r1, 110 + Math.sin(a) * r1); g.lineTo(110 + Math.cos(a) * r2, 110 + Math.sin(a) * r2); g.stroke(); }
    g.fillStyle = `hsl(${hue} 60% 62%)`; g.beginPath(); g.arc(110, 110, 46, 0, 7); g.fill();
  } else {
    g.fillStyle = `hsl(${hue} 70% 55%)`; g.beginPath(); g.moveTo(70, 100); g.lineTo(150, 100); g.lineTo(136, 52); g.lineTo(84, 52); g.closePath(); g.fill();
    g.fillStyle = '#556'; g.fillRect(106, 100, 8, 70); g.beginPath(); g.ellipse(110, 176, 34, 9, 0, 0, 7); g.fill();
  }
  g.restore();
  return c.toDataURL('image/png');
}

export const rows = (state: string): Row[] =>
  state === 'empty' ? [] : KINDS.map(([name, kind, hue], i) => {
    const status: Row['status'] = i === 7 ? 'err' : state === 'done' || i < 3 ? 'ok' : i === 3 && state !== 'done' ? 'run' : 'wait';
    return {
      item: { id: `p${i}`, name, path: draw(kind, hue, 'busy'), size: 900_000 + i * 120_000 },
      status, progress: status === 'run' ? 0.6 : status === 'ok' ? 1 : 0,
      error: status === 'err' ? '图片太小（48×48），至少要 64 像素' : undefined,
      result: status === 'ok' ? { preview: draw(kind, hue, 'check'), outputPath: '/示例', summary: '2400×1800 · 透明背景' } : undefined,
    };
  });

export const notice = { kind: 'ok' as const, text: '完成 7 个，失败 1 个，失败原因见列表' };
