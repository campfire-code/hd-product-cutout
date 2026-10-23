# 第三方开源组件

本工具使用了以下开源组件，许可证原文见各项目仓库。

| 组件 | 用途 | 许可证 |
|---|---|---|
| [BiRefNet](https://github.com/ZhengPeng7/BiRefNet) lite 模型（ONNX 512×512 导出版，取自 [studioludens/birefnet-lite-512](https://huggingface.co/studioludens/birefnet-lite-512)，提交 962e679）。模型不随安装包分发，首次使用时由用户机器从 Hugging Face 下载 | 识别商品主体 | MIT（Copyright (c) 2024 ZhengPeng；导出版 Copyright (c) 2026 Studio Ludens V.O.F.） |
| [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) | 在应用内运行抠图模型 | MIT |
| [Tauri](https://github.com/tauri-apps/tauri) 及官方插件 | 桌面应用框架 | MIT / Apache-2.0 |
| [React](https://github.com/facebook/react) | 界面 | MIT |
| [Lucide](https://github.com/lucide-icons/lucide) | 图标 | ISC |
| [Vite](https://github.com/vitejs/vite) | 构建 | MIT |

引导滤波算法：K. He, J. Sun, X. Tang, "Guided Image Filtering"，本工具自行实现。
