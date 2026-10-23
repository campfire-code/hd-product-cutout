# 高清商品抠图

> 篝火出品 · 收录于篝火 App 应用区

发丝、透明件等难抠的商品，用 BiRefNet 模型本地抠图，批量输出透明 PNG，也可换白底或纯色底

![界面截图](docs/screenshot.png)

## 下载

到 [Releases](https://github.com/campfire-code/hd-product-cutout/releases/latest) 下载对应安装包：

| 电脑 | 文件 |
|---|---|
| Windows 10 / 11 | `hd-product-cutout_版本号_windows-x64-setup.exe` |
| Mac（Apple 芯片） | `hd-product-cutout_版本号_mac-arm64.dmg` |
| Mac（Intel 芯片） | `hd-product-cutout_版本号_mac-x64.dmg` |

系统要求：Windows 10 / 11；macOS 13.3 或更新（抠图引擎需要较新的系统网页引擎）。

第一次打开：
- **Windows**：如果弹出「Windows 已保护你的电脑」，点「更多信息」→「仍要运行」。
- **Mac**：如果提示「无法验证开发者」，打开「系统设置 → 隐私与安全性」，在下方点「仍要打开」。

## 怎么用

1. 把商品图或整个文件夹拖进窗口，支持 JPG、PNG、WebP、BMP。
2. 选择背景：透明（默认，输出 PNG）、纯白，或其他颜色（填颜色代码，例如 `#F5F5F5`）。有底色时可选 PNG / JPG / WebP。
3. 输出尺寸默认保持原图大小；选方形尺寸（800 ～ 2000）时，商品自动居中，四周按「留白」比例空出边距。
4. 「边缘精修」默认开启：用原图细节收紧边缘，发丝更清楚。「边缘羽化」控制边缘柔和程度。
5. 点「开始处理」。透明背景保存为「原文件名-抠图.png」，白底保存为「原文件名-白底.xxx」，其他颜色为「原文件名-底色.xxx」。默认保存在「下载 / 高清商品抠图」。

**模型下载（只有第一次）**
- 第一次点「开始处理」时，软件会下载约 183 MB 的抠图模型（BiRefNet lite，512 输入）到应用数据目录，显示下载进度并校验 SHA-256，之后离线可用。图片本身始终不上传。
- 模型托管在 Hugging Face。如果网络下载不了，可在别处下载 [model.onnx](https://huggingface.co/studioludens/birefnet-lite-512/blob/main/onnx/model.onnx)（SHA-256 以 `1cb0fb36` 开头），在「本地模型文件」里选择它，软件会校验后使用。

**说明与限制**
- 模型输入固定为 512×512（官方 1024×1024 的 ONNX 在应用的网页引擎里会因内存不足无法运行）。大图的细边靠「边缘精修」在原图分辨率上补回，效果不等同于 1024 原版，处理后请抽查。
- 在普通电脑上单张约 4～5 秒（CPU 单线程），批量时一张接一张处理。
- 抠出的边缘可能带有一点点原背景的颜色，换到差异很大的底色上请放大检查。
- 抠图结果建议人工抽查后再上传到店铺。

## 验收用例

把 `samples/` 文件夹拖进窗口，保持默认参数（透明、保持原图尺寸、边缘精修开、羽化 1），点「开始处理」（第一次会先下载模型）：

| 示例文件 | 应得到 |
|---|---|
| `毛绒球-示例.png` | `毛绒球-示例-抠图.png`，1200×900，背景透明，橙色毛球及四周细毛丝保留，背景色块被去掉 |
| `玻璃瓶-示例.png` | `玻璃瓶-示例-抠图.png`，1200×900，背景透明，半透明瓶身及白色瓶边保留 |
| `损坏文件.jpg` | 列表显示「失败：无法识别这张图片，可能已损坏或格式不受支持」 |

背景改成「纯白」、输出尺寸 1000×1000 再处理一次，应得到 `毛绒球-示例-白底.png` 等，尺寸 1000×1000，主体居中、四周留白约 8%。

## 自己编译

需要 Node.js 22、pnpm、Rust。

```bash
pnpm install
pnpm test          # 单元测试
pnpm tauri dev     # 开发运行
pnpm tauri build   # 打包
```

界面框架在 `src/kit`（所有 campfire-code 工具共用），本工具的逻辑在 `src/tool`。

## 致谢

本工具使用开源项目 [ZhengPeng7/BiRefNet](https://github.com/ZhengPeng7/BiRefNet)（MIT）的 BiRefNet_lite 模型，ONNX 版本取自社区导出 [studioludens/birefnet-lite-512](https://huggingface.co/studioludens/birefnet-lite-512)（MIT），推理用 [ONNX Runtime](https://github.com/microsoft/onnxruntime)（MIT）。边缘精修采用 He 等人的引导滤波算法。

## 归属

本工具由**篝火**出品，是篝火 App 应用区收录的开源工具之一，由篝火（GitHub 组织 [campfire-code](https://github.com/campfire-code)）维护与更新。全部工具的目录见 [toolkit-hub](https://github.com/campfire-code/toolkit-hub)。

## 许可证

MIT，版权方为篝火（campfire-code）。
