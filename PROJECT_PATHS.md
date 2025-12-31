# 项目路径配置

## 项目结构
```
项目根目录 (.)
├── backend/                    # 后端目录
│   ├── src/                   # 后端源码
│   │   ├── controllers/       # 控制器
│   │   ├── routes/           # 路由
│   │   ├── services/         # 服务层
│   │   ├── types/            # 类型定义
│   │   └── index.ts          # 入口文件
│   ├── package.json          # 后端依赖
│   └── node_modules/         # 后端依赖包
├── frontend/                  # 前端目录
├── image/                     # 模板图片目录
│   ├── *.jpg, *.png          # 模板预览图
│   └── prompt.txt            # 提示词文件
├── .kiro/specs/              # 规格文档
└── ...
```

## 关键路径
- 后端源码: `backend/src/`
- 模板图片: `image/`
- 规格文档: `.kiro/specs/ai-image-generator/`

## 执行命令的正确路径
- 后端开发服务器: 在 `backend/` 目录下执行 `npm run dev`
- 后端测试: 在 `backend/` 目录下执行测试命令
- 前端开发: 在 `frontend/` 目录下执行相关命令