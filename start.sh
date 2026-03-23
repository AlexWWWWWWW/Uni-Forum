#!/bin/bash

echo "======================================"
echo "  Uni-Forum 后端服务启动脚本"
echo "======================================"
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"
echo ""

# 检查node_modules是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装成功"
    echo ""
fi

# 检查.env文件是否存在
if [ ! -f ".env" ]; then
    echo "⚠️  警告: 未找到 .env 文件，正在从 .env.example 复制..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env 文件已创建，请根据需要修改配置"
    else
        echo "❌ 错误: .env.example 文件不存在"
        exit 1
    fi
    echo ""
fi

# 创建uploads目录
if [ ! -d "uploads" ]; then
    echo "📁 创建 uploads 目录..."
    mkdir -p uploads
    echo "✅ uploads 目录已创建"
    echo ""
fi

# 初始化话题
echo "🔄 正在初始化话题..."
node scripts/initTopics.js
echo "✅ 话题初始化完成"
echo ""

# 启动服务
echo "🚀 正在启动服务..."
echo ""
# npm start
npm run dev

