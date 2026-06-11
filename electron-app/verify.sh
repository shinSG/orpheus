#!/bin/bash

echo "=== MiMo TTS Desktop 项目验证 ==="
echo ""

# 检查依赖
echo "1. 检查依赖安装..."
if [ -d "node_modules" ]; then
    echo "   ✅ node_modules 已安装"
else
    echo "   ❌ node_modules 未安装，请运行 npm install"
    exit 1
fi

# 检查构建输出
echo "2. 检查构建输出..."
if [ -f "dist/main/index.js" ]; then
    echo "   ✅ 主进程已编译"
else
    echo "   ❌ 主进程未编译，请运行 npm run build:main"
    exit 1
fi

if [ -f "dist/renderer/index.html" ]; then
    echo "   ✅ 渲染进程已构建"
else
    echo "   ❌ 渲染进程未构建，请运行 npm run build:renderer"
    exit 1
fi

# 检查源文件
echo "3. 检查源文件..."
files=(
    "src/main/index.ts"
    "src/renderer/index.html"
    "src/renderer/src/main.tsx"
    "src/renderer/src/App.tsx"
    "src/renderer/src/components/TTSForm.tsx"
    "src/renderer/src/components/AudioPlayer.tsx"
    "src/renderer/src/components/CacheManager.tsx"
    "src/renderer/src/hooks/useTTS.ts"
    "src/renderer/src/lib/api.ts"
    "src/shared/types.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file 缺失"
    fi
done

echo ""
echo "=== 验证完成 ==="
echo ""
echo "启动方式："
echo "  1. 启动后端: cd .. && uvicorn app.main:app --reload"
echo "  2. 启动桌面: npm run dev"
