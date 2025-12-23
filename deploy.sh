#!/bin/bash
set -e

# 加载配置文件
if [ ! -f config.env ]; then
    echo 错误: config.env 文件不存在
    exit 1
fi

source config.env

echo === Storycraft 部署脚本 ===
echo 项目: 
echo 服务: 
echo 区域: 
echo 

# 1. 生成 NEXTAUTH_SECRET
echo 1. 生成 NEXTAUTH_SECRET...
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# 2. 构建镜像 URI
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${SERVICE_NAME}:${TIMESTAMP}"

echo 2. 构建 Docker 镜像...
echo  镜像: $IMAGE_URI
docker build -t $IMAGE_URI /opt/storycraft

echo 3. 推送镜像...
docker push $IMAGE_URI

# 4. 构建环境变量
echo 4. 准备环境变量...
ENV_VARS=PROJECT_ID=${PROJECT_ID}
ENV_VARS=${ENV_VARS},LOCATION=${REGION}
ENV_VARS=${ENV_VARS},GCS_VIDEOS_STORAGE_URI=${GCS_VIDEOS_STORAGE_URI}
ENV_VARS=${ENV_VARS},NODE_ENV=${NODE_ENV}
ENV_VARS=${ENV_VARS},AUTH_TRUST_HOST=${AUTH_TRUST_HOST}
ENV_VARS=${ENV_VARS},NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV_VARS=${ENV_VARS},AUTH_GOOGLE_ID=${AUTH_GOOGLE_ID}
ENV_VARS=${ENV_VARS},AUTH_GOOGLE_SECRET=${AUTH_GOOGLE_SECRET}

# 添加白名单配置
if [ -n $ALLOWED_EMAIL_DOMAINS ]; then
    ENV_VARS=${ENV_VARS},ALLOWED_EMAIL_DOMAINS=${ALLOWED_EMAIL_DOMAINS}
fi

if [ -n $ALLOWED_EMAILS ]; then
    ENV_VARS=${ENV_VARS},ALLOWED_EMAILS=${ALLOWED_EMAILS}
fi

# 5. 部署到 Cloud Run
echo 5. 部署到 Cloud Run...
gcloud run deploy $SERVICE_NAME \
  --image=$IMAGE_URI \
  --region=$REGION \
  --platform=managed \
  --memory=4Gi \
  --cpu=2 \
  --timeout=3600 \
  --set-env-vars=$ENV_VARS

# 6. 获取服务 URL
echo 
echo 6. 获取服务 URL...
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')

# 7. 更新 NEXTAUTH_URL
echo 7. 更新 NEXTAUTH_URL...
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --update-env-vars NEXTAUTH_URL=${SERVICE_URL}

echo 
echo === 部署完成 ===
echo 服务 URL: $SERVICE_URL
echo NextAuth Secret: $NEXTAUTH_SECRET
echo 
echo OAuth Client ID: $AUTH_GOOGLE_ID
echo 白名单域名: $ALLOWED_EMAIL_DOMAINS
echo 白名单邮箱: $ALLOWED_EMAILS
