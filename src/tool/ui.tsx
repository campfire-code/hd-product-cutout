// 界面：空状态（一面抠好的透明图墙示意）与单条结果（点一下换底色，检查边缘）
import { useState } from 'react';
import { Palette, ScanSearch, Sparkles, Layers } from 'lucide-react';
import type { InputItem, ItemResult } from '../kit/types';
import { fileSrc } from '../kit/platform';
import './tool.css';

const GROUNDS: [string, string][] = [['透明棋盘', 'checker'], ['纯白', '#FFFFFF'], ['深灰', '#23262D'], ['浅粉', '#F7D9DF']];

function Sketch({ kind }: { kind: 'cup' | 'bottle' | 'fluff' | 'lamp' }) {
  if (kind === 'cup') return (<g><rect x="30" y="22" width="34" height="62" rx="8" fill="#2F6FB4" /><rect x="32" y="14" width="30" height="10" rx="3" fill="#E4E6EA" /><path d="M64 38 q16 4 0 28" fill="none" stroke="#2F6FB4" strokeWidth="6" strokeLinecap="round" /></g>);
  if (kind === 'bottle') return (<g><rect x="32" y="44" width="34" height="42" rx="12" fill="#8CC7D6" opacity=".7" stroke="#EAF6F9" strokeWidth="2" /><rect x="43" y="26" width="12" height="22" rx="3" fill="#8CC7D6" opacity=".7" stroke="#EAF6F9" strokeWidth="2" /><rect x="41" y="18" width="16" height="9" rx="2" fill="#7A4B2A" /></g>);
  if (kind === 'fluff') return (<g stroke="#E58AA6" strokeWidth="1.3">{Array.from({ length: 70 }, (_, i) => { const a = i * 2.399; const r2 = 36 + (i % 6) * 3; return <line key={i} x1={50 + Math.cos(a) * 20} y1={50 + Math.sin(a) * 20} x2={50 + Math.cos(a) * r2} y2={50 + Math.sin(a) * r2} />; })}<circle cx="50" cy="50" r="24" fill="#E58AA6" stroke="none" /></g>);
  return (<g><path d="M32 52 L68 52 L62 24 L38 24 Z" fill="#F0A93B" /><rect x="47" y="52" width="5" height="30" fill="#5B6270" /><ellipse cx="50" cy="86" rx="16" ry="5" fill="#5B6270" /></g>);
}

export function Empty({ hover }: { hover: boolean }) {
  const kinds = ['fluff', 'cup', 'bottle', 'lamp'] as const;
  return (
    <div className={`hd-empty${hover ? ' hover' : ''}`}>
      <div className="hd-wall-demo" aria-hidden="true">
        {kinds.map((k, i) => (
          <svg key={k} viewBox="0 0 100 100" className={i === 0 ? 'big' : ''}><Sketch kind={k} /></svg>
        ))}
      </div>
      <h2>难抠的商品，一面墙抠干净</h2>
      <p>发丝、毛绒、玻璃瓶这些普通抠图会留毛边的商品，交给高清模型。结果是一面透明图墙，点一下就能换底色，检查边缘有没有残留。</p>
      <ul className="hd-points">
        <li><ScanSearch size={14} />发丝、半透明件</li>
        <li><Sparkles size={14} />边缘精修加羽化</li>
        <li><Layers size={14} />输出透明 PNG</li>
      </ul>
      <p className="hd-hint">把商品图或整个文件夹拖进窗口，也可以点右上角的添加按钮。</p>
    </div>
  );
}

function tagOf(summary?: string) {
  if (!summary) return '成品';
  if (summary.includes('透明')) return '透明 PNG';
  if (summary.includes('白底')) return '白底';
  return '纯色底';
}

export function ResultBody({ item, result }: { item: InputItem; result: ItemResult }) {
  const [g, setG] = useState(0);
  const [name, ground] = GROUNDS[g];
  const src = result.preview ? fileSrc(result.preview) : '';
  return (
    <button
      type="button"
      className={`hd-cut${ground === 'checker' ? ' checker' : ''}`}
      style={ground === 'checker' ? undefined : { background: ground }}
      onClick={(e) => { e.stopPropagation(); setG((g + 1) % GROUNDS.length); }}
      aria-label={`${item.name}，当前底色：${name}，点击切换底色`}
      title="点击切换底色，检查边缘"
    >
      {src && <img src={src} alt="" draggable={false} />}
      <em className="hd-tag">{tagOf(result.summary)}</em>
      <em className="hd-ground"><Palette size={12} />{name}</em>
    </button>
  );
}
