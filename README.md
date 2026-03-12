# 🐍 Multiplayer Snake Game

一个基于 WebSocket 的实时多人贪吃蛇游戏。

## 游戏特性

- 🎮 **多人实时对战** - 支持 2-4 名玩家同时游戏
- ⚡ **实时同步** - 基于 Socket.io 的低延迟通信
- 🎨 **彩色玩家** - 每个玩家自动分配不同颜色
- 📊 **实时记分榜** - 显示所有玩家分数排名
- 🔄 **一键重开** - 随时重新开始游戏

## 技术栈

- **前端**: React 18 + Vite
- **后端**: Node.js + Express + Socket.io
- **通信**: WebSocket (Socket.io)

---

## 📦 本地部署

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装步骤

```bash
# 1. 克隆项目 (如果从仓库获取)
git clone <repository-url>
cd ohmyopencodeSnake

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

### 访问游戏

- **前端**: http://localhost:5173
- **后端**: http://localhost:3000

### 多人游戏测试

1. 打开多个浏览器标签页
2. 每个标签页访问 http://localhost:5173
3. 每个标签页代表一个不同的玩家

---

## 🚀 云端部署

### 方案一: Railway (推荐)

Railway 提供简单的 Node.js 部署服务。

#### 1. 准备工作

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录 Railway
railway login
```

#### 2. 修改配置

创建 `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 3. 添加启动脚本

在 `package.json` 中添加:

```json
{
  "scripts": {
    "start": "node server/server.js",
    "build": "vite build",
    "postinstall": "npm run build"
  }
}
```

#### 4. 修改服务器配置

更新 `server/server.js`:

```javascript
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});
```

#### 5. 部署

```bash
# 初始化项目
railway init

# 添加环境变量
railway variables set FRONTEND_URL=https://your-frontend-url.railway.app

# 部署
railway up
```

---

### 方案二: Vercel (前端) + Railway (后端)

#### 前端部署到 Vercel

1. 创建 `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

2. 更新 `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/socket.io': {
        target: process.env.VITE_SERVER_URL || 'http://localhost:3000',
        ws: true
      }
    }
  }
});
```

3. 部署:

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
vercel
```

#### 后端部署到 Railway

参见方案一的步骤。

---

### 方案三: Docker 部署

#### 1. 创建 Dockerfile

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY server ./server

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["node", "server/server.js"]
```

#### 2. 更新服务器配置

在 `server/server.js` 中添加静态文件服务:

```javascript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Game } from './game.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// 生产环境提供静态文件
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// ... 其他代码
```

#### 3. 构建和运行

```bash
# 构建镜像
docker build -t multiplayer-snake .

# 运行容器
docker run -p 3000:3000 multiplayer-snake
```

#### 4. Docker Compose (可选)

创建 `docker-compose.yml`:

```yaml
version: '3.8'
services:
  game:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

```bash
docker-compose up -d
```

---

### 方案四: 云服务器部署 (AWS/阿里云/腾讯云)

#### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PM2 (进程管理)
sudo npm install -g pm2
```

#### 2. 上传代码

```bash
# 使用 scp 或 git clone
git clone <repository-url>
cd ohmyopencodeSnake
npm install
npm run build
```

#### 3. 使用 PM2 启动

```bash
# 启动服务
pm2 start server/server.js --name "snake-game"

# 设置开机自启
pm2 startup
pm2 save
```

#### 4. Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🔧 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `PORT` | 服务器端口 | `3000` |
| `FRONTEND_URL` | 前端URL (CORS配置) | `http://localhost:5173` |
| `NODE_ENV` | 运行环境 | `development` |

---

## 📁 项目结构

```
ohmyopencodeSnake/
├── server/
│   ├── server.js      # Express + Socket.io 服务器
│   ├── game.js        # 游戏逻辑
│   └── player.js      # 玩家管理 (占位)
├── src/
│   ├── main.jsx       # React 入口
│   ├── App.jsx        # 主组件
│   ├── components/
│   │   ├── GameCanvas.jsx   # 游戏画布
│   │   └── ScoreBoard.jsx   # 记分榜
│   └── hooks/
│       ├── useSocket.js     # Socket 连接
│       ├── useGame.js       # 游戏状态
│       └── useKeyboard.js   # 键盘输入
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## 🎮 游戏操作

- **移动**: 方向键 或 W/A/S/D
- **重新开始**: 点击 "重新开始" 按钮

---

## 🐛 故障排除

### 页面空白

1. 检查浏览器控制台是否有错误 (F12)
2. 强制刷新页面 (Ctrl+Shift+R / Cmd+Shift+R)
3. 确保后端服务器正在运行
4. 检查 WebSocket 连接状态

### 无法连接到服务器

1. 检查端口 3000 是否被占用
2. 检查防火墙设置
3. 确认 CORS 配置正确

### WebSocket 连接失败

1. 检查代理配置是否正确
2. 确认服务器 Socket.io 版本与客户端匹配
3. 检查网络是否支持 WebSocket

---

## 📄 License

MIT