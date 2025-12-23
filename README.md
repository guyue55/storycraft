> ###### _This is not an officially supported Google product._

# StoryCraft

AI-powered video storyboard generation platform using Google.s Gemini 3 Pro and Veo 3.1 models.

## Features

- 🎬 Sequential video generation with Veo 3.1
- 🎨 Image generation with Gemini 3 Pro (Image Preview)
- 🔐 Google OAuth with email whitelist
- 📝 Cloud-based story management
- ⚡ Real-time preview and regeneration

## Quick Start

### Prerequisites
- Node.js 20+
- Google Cloud Platform account
- Docker (for deployment)

### Setup

1. Clone and install:
```bash
git clone https://github.com/johnzhzhang/storycraft.git
cd storycraft
npm install
```

2. Configure environment:
```bash
cp config.env.example config.env
# Edit config.env with your values
```

3. Set up GCP:
```bash
# Enable APIs
gcloud services enable aiplatform.googleapis.com storage.googleapis.com firestore.googleapis.com run.googleapis.com

# Create GCS bucket
gcloud storage buckets create gs://YOUR_BUCKET --location=us-central1

# Create Firestore index
gcloud firestore indexes composite create \
  --collection-group=scenarios \
  --field-config field-path=userId,order=ASCENDING \
  --field-config field-path=updatedAt,order=DESCENDING
```

4. Run development:
```bash
npm run dev
```

## Deployment

### Configuration File

The deployment uses a centralized configuration file `config.env` that contains all necessary settings.

#### Create Configuration File

```bash
cp config.env.example config.env
```

#### Configuration Parameters

Edit `config.env` with your values:

```bash
# ============================================
# Project Configuration
# ============================================
PROJECT_ID=your-gcp-project-id              # Your GCP project ID
REGION=us-central1                          # Deployment region
SERVICE_NAME=storycraft-service             # Cloud Run service name
REPOSITORY=storycraft                       # Artifact Registry repository

# ============================================
# GCS Configuration
# ============================================
GCS_VIDEOS_STORAGE_URI=gs://your-bucket/videos/  # GCS bucket for video storage

# ============================================
# OAuth Configuration
# ============================================
AUTH_GOOGLE_ID=your-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-your-secret-key

# ============================================
# Whitelist Configuration
# ============================================
# Allow entire email domains (comma-separated, no spaces)
ALLOWED_EMAIL_DOMAINS=@company.com,@partner.org

# Allow specific email addresses (comma-separated, no spaces)
ALLOWED_EMAILS=admin@gmail.com,user@example.com

# ============================================
# Application Configuration
# ============================================
NODE_ENV=production
AUTH_TRUST_HOST=true
```

### Deployment Steps

#### Step 1: Prepare GCP Environment

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable \
  aiplatform.googleapis.com \
  storage.googleapis.com \
  firestore.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com

# Create Artifact Registry repository
gcloud artifacts repositories create storycraft \
  --repository-format=docker \
  --location=us-central1 \
  --description="StoryCraft Docker repository"

# Create GCS bucket for videos
gcloud storage buckets create gs://YOUR_BUCKET_NAME \
  --location=us-central1 \
  --uniform-bucket-level-access

# Initialize Firestore
gcloud firestore databases create --location=us-central1

# Create Firestore composite index
gcloud firestore indexes composite create \
  --collection-group=scenarios \
  --query-scope=COLLECTION \
  --field-config field-path=userId,order=ASCENDING \
  --field-config field-path=updatedAt,order=DESCENDING
```

#### Step 2: Configure OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Click **Create Credentials > OAuth 2.0 Client ID**
4. Configure:
   - Application type: **Web application**
   - Name: `StoryCraft`
   - Authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://your-service-url.run.app/api/auth/callback/google`
5. Copy **Client ID** and **Client Secret** to `config.env`

#### Step 3: Configure Deployment Settings

Edit `config.env`:

```bash
# Update with your actual values
PROJECT_ID=my-project-123
REGION=us-central1
SERVICE_NAME=storycraft-prod
REPOSITORY=storycraft

# Update GCS bucket
GCS_VIDEOS_STORAGE_URI=gs://my-project-123-videos/

# Add OAuth credentials
AUTH_GOOGLE_ID=123456789-abc.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-your-actual-secret

# Configure whitelist
ALLOWED_EMAIL_DOMAINS=@mycompany.com
```

#### Step 4: Deploy to Cloud Run

Run the deployment script:

```bash
bash deploy.sh
```

The script will:
1. Load configuration from `config.env`
2. Generate a new `NEXTAUTH_SECRET`
3. Build Docker image with timestamp tag
4. Push image to Artifact Registry
5. Deploy to Cloud Run with all environment variables
6. Get service URL
7. Update `NEXTAUTH_URL` environment variable
8. Display deployment information

**Expected Output:**
```
=== Storycraft 部署脚本 ===
项目: my-project-123
服务: storycraft-prod
区域: us-central1

1. 生成 NEXTAUTH_SECRET...
2. 构建 Docker 镜像...
   镜像: us-central1-docker.pkg.dev/my-project-123/storycraft/storycraft-prod:20251223-140500
3. 推送镜像...
4. 准备环境变量...
5. 部署到 Cloud Run...
6. 获取服务 URL...
7. 更新 NEXTAUTH_URL...

=== 部署完成 ===
服务 URL: https://storycraft-prod-abc123.run.app
NextAuth Secret: [generated-secret]

OAuth Client ID: 123456789-abc.apps.googleusercontent.com
白名单域名: @mycompany.com
白名单邮箱: 
```

#### Step 5: Update OAuth Redirect URI

After deployment, add the production URL to OAuth settings:

1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Add to **Authorized redirect URIs**:
   ```
   https://your-actual-service-url.run.app/api/auth/callback/google
   ```
4. Save changes

#### Step 6: Verify Deployment

```bash
# Check service status
gcloud run services describe storycraft-prod \
  --region us-central1 \
  --format="value(status.url,status.conditions)"

# Test service
curl -I https://your-service-url.run.app

# Check logs
gcloud logging read \
  "resource.type=cloud_run_revision \
   AND resource.labels.service_name=storycraft-prod" \
  --limit 50 \
  --format json
```

### Deployment Script Details

The `deploy.sh` script performs the following:

```bash
#!/bin/bash
set -e

# 1. Load configuration
source config.env

# 2. Generate NEXTAUTH_SECRET (32-byte random string)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# 3. Build image with timestamp tag
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${SERVICE_NAME}:${TIMESTAMP}"
docker build -t $IMAGE_URI .

# 4. Push to Artifact Registry
docker push $IMAGE_URI

# 5. Build environment variables string
ENV_VARS="PROJECT_ID=${PROJECT_ID}"
ENV_VARS="${ENV_VARS},LOCATION=${REGION}"
ENV_VARS="${ENV_VARS},GCS_VIDEOS_STORAGE_URI=${GCS_VIDEOS_STORAGE_URI}"
# ... (adds all config.env variables)

# 6. Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image=$IMAGE_URI \
  --region=$REGION \
  --platform=managed \
  --memory=4Gi \
  --cpu=2 \
  --timeout=3600 \
  --set-env-vars="$ENV_VARS"

# 7. Get service URL and update NEXTAUTH_URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
gcloud run services update $SERVICE_NAME \
  --region=$REGION \
  --update-env-vars "NEXTAUTH_URL=${SERVICE_URL}"
```

### Update Deployment

To update the application:

1. Pull latest code:
   ```bash
   git pull origin main
   ```

2. Update configuration if needed:
   ```bash
   nano config.env
   ```

3. Redeploy:
   ```bash
   bash deploy.sh
   ```

### Rollback

If you need to rollback to a previous version:

```bash
# List all revisions
gcloud run revisions list \
  --service=storycraft-prod \
  --region=us-central1

# Rollback to specific revision
gcloud run services update-traffic storycraft-prod \
  --to-revisions=storycraft-prod-00042-abc=100 \
  --region=us-central1
```

### Environment Variables Reference

All environment variables set by the deployment:

| Variable | Source | Description |
|----------|--------|-------------|
| `PROJECT_ID` | config.env | GCP project ID |
| `LOCATION` | config.env | Deployment region |
| `GCS_VIDEOS_STORAGE_URI` | config.env | GCS bucket for videos |
| `NODE_ENV` | config.env | Application environment |
| `AUTH_TRUST_HOST` | config.env | Trust host header |
| `NEXTAUTH_SECRET` | Generated | Session encryption key |
| `NEXTAUTH_URL` | Auto-detected | Service URL |
| `AUTH_GOOGLE_ID` | config.env | OAuth Client ID |
| `AUTH_GOOGLE_SECRET` | config.env | OAuth Client Secret |
| `ALLOWED_EMAIL_DOMAINS` | config.env | Whitelist domains |
| `ALLOWED_EMAILS` | config.env | Whitelist emails |

### Security Best Practices

1. **Never commit `config.env`** - It's in `.gitignore`
2. **Rotate secrets regularly** - Regenerate `NEXTAUTH_SECRET` periodically
3. **Use Secret Manager** (optional) - For production environments:
   ```bash
   # Store secret
   echo -n "your-secret" | gcloud secrets create auth-google-secret --data-file=-
   
   # Reference in Cloud Run
   gcloud run services update storycraft-prod \
     --update-secrets=AUTH_GOOGLE_SECRET=auth-google-secret:latest
   ```
4. **Restrict service account permissions** - Use least privilege principle
5. **Enable Cloud Armor** (optional) - For DDoS protection

### Cost Optimization

- **Memory**: 4Gi (adjust based on usage)
- **CPU**: 2 (can reduce to 1 for lower traffic)
- **Timeout**: 3600s (for long video generation)
- **Min instances**: 0 (scales to zero when idle)
- **Max instances**: 100 (adjust based on expected load)

To adjust resources:
```bash
gcloud run services update storycraft-prod \
  --memory=2Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --region=us-central1
```

## Configuration

### Email Whitelist

Edit `config.env`:
```bash
# Allow entire domains
ALLOWED_EMAIL_DOMAINS=@company.com,@partner.org

# Allow specific emails
ALLOWED_EMAILS=user@gmail.com,admin@example.com
```

Redeploy:
```bash
bash deploy.sh
```

## Tech Stack

- **Framework**: Next.js 15, React 19, TypeScript
- **AI Models**: Google Vertex AI (Gemini 3 Pro, Veo 3.1)
- **Database**: Firestore
- **Storage**: Google Cloud Storage
- **Auth**: NextAuth.js with Google OAuth
- **UI**: Tailwind CSS, Radix UI, Lucide Icons

## Project Structure

```
storycraft/
├── app/                    # Next.js app
│   ├── api/               # API routes
│   ├── components/        # React components
│   └── page.tsx          # Main page
├── auth.ts                # Authentication config
├── config.env.example     # Config template
├── deploy.sh              # Deployment script
└── Dockerfile             # Docker config
```

## Key Features

### Sequential Video Generation
Generate videos one at a time with manual control:
- "Generate Next" button for sequential generation
- "Complete & Edit" button to finish
- Hover to regenerate individual videos

### Email Whitelist
Domain or email-based access control:
```typescript
async signIn({ user }) {
  const email = user.email?.toLowerCase();
  const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS?.split(',');
  
  for (const domain of allowedDomains) {
    if (email.endsWith(domain)) return true;
  }
  return false;
}
```


**OAuth errors**: Check Client ID/Secret and redirect URIs

**Firestore errors**: Verify composite index is created

**Logs**:
```bash
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

## License

Apache 2.0

## Contributing

Open a GitHub issue for questions or problems.

## Troubleshooting

**OAuth errors**: Check Client ID/Secret and redirect URIs

**Firestore errors**: Verify composite index is created

## Troubleshooting

**OAuth errors**: Check Client ID/Secret and redirect URIs

**Firestore errors**: Verify composite index is created

**Logs**:
```bash
gcloud logging read resource.type=cloud_run_revision --limit 50
```

## License

Apache 2.0

## Contributing

Open a GitHub issue for questions or problems.
