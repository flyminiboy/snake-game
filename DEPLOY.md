# 部署文档

## 服务器信息

- **IP**: 39.103.58.53
- **系统**: Ubuntu 24.04.4 LTS
- **Node.js**: v22.22.1
- **PM2**: 6.0.14
- **Nginx**: 1.24.0

## 访问地址

- **游戏地址**: http://39.103.58.53

## 部署架构

```
阿里云 ECS (Ubuntu 24.04)
├── Nginx (端口 80)
│   ├── 静态文件: /var/www/snake-game/dist
│   └── Socket.io 代理: → localhost:3000
│
├── PM2
│   └── snake-game (Node.js 服务)
│       └── 端口: 3000
│
└── 项目目录: /var/www/snake-game
```

## 常用命令

### SSH 连接
```bash
ssh root@39.103.58.53
```

### PM2 管理
```bash
pm2 list              # 查看进程
pm2 logs snake-game   # 查看日志
pm2 restart snake-game # 重启服务
pm2 stop snake-game   # 停止服务
```

### Nginx 管理
```bash
systemctl status nginx  # 查看状态
systemctl reload nginx  # 重载配置
systemctl restart nginx # 重启服务
```

### 更新部署
```bash
cd /var/www/snake-game
git pull
npm install
npm run build
pm2 restart snake-game
```

## 文件位置

- **项目目录**: /var/www/snake-game
- **Nginx 配置**: /etc/nginx/sites-available/snake-game
- **PM2 配置**: /var/www/snake-game/ecosystem.config.cjs
- **PM2 日志**: /root/.pm2/logs/

## 阿里云安全组

确保以下端口开放：
- **22**: SSH
- **80**: HTTP
- **443**: HTTPS (如需 SSL)

## 故障排查

### 服务无法访问
```bash
# 检查 PM2 状态
pm2 list

# 检查 Nginx 状态
systemctl status nginx

# 检查端口
netstat -tlnp | grep -E '80|3000'
```

### 查看错误日志
```bash
# PM2 错误日志
pm2 logs snake-game --err

# Nginx 错误日志
tail -f /var/log/nginx/error.log
```