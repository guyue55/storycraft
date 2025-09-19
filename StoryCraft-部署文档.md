# StoryCraft 部署文档

## 概述
StoryCraft 是一个基于 Next.js 的 AI 故事创作应用，部署在 Google Cloud Platform 上。

## 部署架构
- **平台**: Google Cloud Platform
- **计算**: Cloud Run (无服务器容器)
- **存储**: Cloud Storage + Firestore
- **构建**: Cloud Build
- **镜像仓库**: Artifact Registry
- **认证**: Google OAuth 2.0

## 前置条件

### 1. 环境要求
- Google Cloud SDK 已安装并配置
- 具有项目管理员权限的 Google Cloud 账户
- SSH 访问权限到部署服务器

### 2. 项目信息
- **项目ID**: `john-poc-453315`
- **项目编号**: `216643156132`
- **区域**: `us-central1`
- **服务器**: `34.134.201.73`

## 部署步骤

### 第一步：基础设施部署

1. **连接到部署服务器**
```bash
ssh root@34.134.201.73 -o ProxyCommand=none
```

2. **克隆代码仓库**
```bash
cd /opt
git clone https://github.com/johnzhzhang/storycraft.git
cd storycraft
```

3. **下载部署脚本**
```bash
curl -s https://raw.githubusercontent.com/johnzhzhang/storycraft/main/gcloud-deploy.sh.template -o gcloud-deploy.sh.template
curl -s https://raw.githubusercontent.com/johnzhzhang/storycraft/main/gcloud-run-build.sh.template -o gcloud-run-build.sh.template
cp gcloud-deploy.sh.template gcloud-deploy.sh
cp gcloud-run-build.sh.template gcloud-run-build.sh
chmod +x gcloud-deploy.sh gcloud-run-build.sh
```

4. **配置项目ID**
```bash
sed -i 's/INPUT YOUR PROJECT_ID/john-poc-453315/g' gcloud-deploy.sh
```

5. **执行基础设施部署**
```bash
./gcloud-deploy.sh
```

**创建的资源**：
- Google Cloud APIs (Cloud Run, Cloud Build, Firestore 等)
- 服务账户：`storycraft-service-account@john-poc-453315.iam.gserviceaccount.com`
- Cloud Storage 存储桶：`storycraft-service-assets-john-poc-453315`
- Firestore 数据库：`storycraft-firestore-db`
- Artifact Registry 仓库：`storycraft-service`

### 第二步：OAuth 配置

1. **创建 OAuth 2.0 凭据**
   - 访问：https://console.cloud.google.com/apis/credentials?project=john-poc-453315
   - 点击 "创建凭据" → "OAuth 客户端 ID"
   - 应用类型：Web应用
   - 名称：StoryCraft OAuth Client
   - 已获授权的JavaScript来源：`https://storycraft-service-test-iuogxusjha-uc.a.run.app`
   - 已获授权的重定向URI：`https://storycraft-service-test-iuogxusjha-uc.a.run.app/api/auth/callback/google`

2. **下载凭据文件**
   - 下载 JSON 格式的凭据文件
   - 文件名格式：`client_secret_216643156132-xxxxx.apps.googleusercontent.com.json`

### 第三步：应用部署

1. **安装依赖**
```bash
# 安装 Node.js (如果未安装)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 安装项目依赖
npm install
```

2. **配置 OAuth 凭据**
```bash
# 从 JSON 文件中提取凭据
CLIENT_ID='你的客户端ID'
CLIENT_SECRET='你的客户端密钥'

# 更新部署脚本
sed -i "s/placeholder-google-client-id/$CLIENT_ID/g" gcloud-run-build.sh
sed -i "s/placeholder-google-client-secret/$CLIENT_SECRET/g" gcloud-run-build.sh
```

3. **生成 NextAuth 密钥**
```bash
NEXTAUTH_SECRET=$(openssl rand -base64 32)
sed -i "s/INPUT YOUR NEXTAUTH_SECRET/$NEXTAUTH_SECRET/g" gcloud-run-build.sh
```

4. **修复 NEXTAUTH_URL 配置**
```bash
# 获取实际服务URL并更新配置
ACTUAL_URL=$(gcloud run services describe storycraft-service-test --region=us-central1 --format='value(status.url)' 2>/dev/null || echo 'https://storycraft-service-test-iuogxusjha-uc.a.run.app')
sed -i "s|NEXTAUTH_URL=https://\${SERVICE_NAME}-\${PROJECT_NUMBER}\.\${LOCATION}\.run\.app|NEXTAUTH_URL=$ACTUAL_URL|g" gcloud-run-build.sh
```

5. **构建和部署应用**
```bash
./gcloud-run-build.sh --build --deploy
```

## 部署结果

### 服务信息
- **服务名称**: `storycraft-service-test`
- **服务URL**: https://storycraft-service-test-iuogxusjha-uc.a.run.app
- **区域**: us-central1
- **运行时**: Node.js 23 (Alpine Linux)

### 环境变量
```
NODE_ENV=production
NEXTAUTH_URL=https://storycraft-service-test-iuogxusjha-uc.a.run.app
AUTH_GOOGLE_ID=你的客户端ID
AUTH_GOOGLE_SECRET=你的客户端密钥
NEXTAUTH_SECRET=生成的密钥
GCS_BUCKET_NAME=storycraft-service-assets-john-poc-453315
LOCATION=us-central1
```

## 验证部署

1. **检查服务状态**
```bash
gcloud run services list --region=us-central1
```

2. **访问应用**
   - 打开：https://storycraft-service-test-iuogxusjha-uc.a.run.app
   - 测试 Google 登录功能

3. **查看日志**
```bash
gcloud run services logs read storycraft-service-test --region=us-central1
```

## 故障排除

### 常见问题

1. **OAuth 400 错误**
   - 检查重定向URI配置
   - 确认客户端ID和密钥正确

2. **redirect_uri_mismatch**
   - 验证 NEXTAUTH_URL 与实际服务URL匹配
   - 检查 OAuth 客户端的重定向URI设置

3. **构建失败**
   - 检查 package.json 和依赖文件
   - 确认所有必需文件已下载

### 重新部署
```bash
cd /opt/storycraft
git pull origin main
./gcloud-run-build.sh --build --deploy
```

### 清理资源
```bash
# 删除 Cloud Run 服务
gcloud run services delete storycraft-service-test --region=us-central1

# 删除 Artifact Registry 仓库
gcloud artifacts repositories delete storycraft-service --location=us-central1

# 删除 Storage 存储桶
gsutil rm -r gs://storycraft-service-assets-john-poc-453315
```

## 安全注意事项

1. **服务账户权限**: 使用最小权限原则
2. **OAuth 凭据**: 妥善保管客户端密钥
3. **环境变量**: 不要在代码中硬编码敏感信息
4. **网络访问**: 配置适当的防火墙规则

## 监控和维护

1. **日志监控**: 使用 Cloud Logging 查看应用日志
2. **性能监控**: 通过 Cloud Monitoring 监控服务性能
3. **成本优化**: 定期检查资源使用情况
4. **安全更新**: 定期更新依赖包和基础镜像

## 联系信息
- **项目负责人**: admin@johnzzhang.altostrat.com
- **技术支持**: 通过 GitHub Issues 提交问题
