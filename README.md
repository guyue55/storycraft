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
├── app/                           # Next.js 15 App Router
│   ├── api/                       # API Routes (Server-side)
│   │   ├── auth/[...nextauth]/   # NextAuth.js authentication endpoints
│   │   ├── scenarios/            # Story CRUD operations
│   │   ├── users/                # User management
│   │   ├── generate-image/       # Image generation endpoint
│   │   ├── generate-video/       # Video generation endpoint
│   │   └── export-video/         # Video export and composition
│   ├── components/               # React Components
│   │   ├── storyboard/          # Storyboard UI components
│   │   │   ├── storyboard-tab.tsx      # Main storyboard interface
│   │   │   ├── scene-data.tsx          # Individual scene card
│   │   │   └── scene-controls.tsx      # Scene action buttons
│   │   ├── ui/                  # Reusable UI components (Radix UI)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── popover.tsx
│   │   │   └── gcs-image.tsx           # GCS image loader
│   │   └── video/               # Video player components
│   │       └── video-player.tsx        # Custom video player
│   ├── sign-in/                 # Authentication pages
│   │   └── page.tsx             # Sign-in page
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Main application page
│   └── logger.ts                # Logging utility
├── lib/                          # Core Libraries
│   ├── gemini.ts                # Gemini 3 Pro image generation
│   ├── imagen.ts                # Imagen 4.0 API client
│   ├── veo.ts                   # Veo 3.1 video generation
│   ├── firestore.ts             # Firestore database operations
│   └── gcs.ts                   # Google Cloud Storage operations
├── hooks/                        # React Hooks
│   └── use-auth.ts              # Authentication hook
├── types/                        # TypeScript type definitions
│   └── index.ts                 # Shared types (Scene, Scenario, etc.)
├── auth.ts                       # NextAuth.js configuration
├── middleware.ts                 # Next.js middleware (auth protection)
├── config.env.example            # Configuration template
├── deploy.sh                     # Deployment script
├── Dockerfile                    # Docker container configuration
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── package.json                  # Dependencies and scripts
```

## Application Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client (Browser)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   React UI  │  │  TanStack    │  │  NextAuth.js     │  │
│  │  Components │  │   Query      │  │   Client         │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Server (Cloud Run)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              App Router (app/)                        │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │   Pages    │  │  API Routes│  │ Middleware │    │  │
│  │  │  (SSR/RSC) │  │  (Server)  │  │   (Auth)   │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Core Libraries (lib/)                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │  │
│  │  │  Gemini  │  │   Veo    │  │Firestore │          │  │
│  │  │  Client  │  │  Client  │  │  Client  │          │  │
│  │  └──────────┘  └──────────┘  └──────────┘          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐  ┌──────────────────┐  ┌──────────────┐
│  Vertex AI    │  │    Firestore     │  │     GCS      │
│ (Gemini, Veo) │  │   (Database)     │  │  (Storage)   │
└───────────────┘  └──────────────────┘  └──────────────┘
```

### Request Flow

#### 1. User Authentication Flow

```
User clicks "Sign in with Google"
    ↓
NextAuth.js redirects to Google OAuth
    ↓
User authorizes application
    ↓
Google redirects back with auth code
    ↓
NextAuth.js exchanges code for tokens
    ↓
auth.ts: signIn callback validates email
    ↓
Check ALLOWED_EMAIL_DOMAINS / ALLOWED_EMAILS
    ↓
If authorized: Create session with JWT
    ↓
Store session in encrypted cookie
    ↓
Redirect to main application
```

#### 2. Image Generation Flow

```
User enters prompt and clicks "Generate Images"
    ↓
Frontend: POST /api/generate-image
    ↓
Middleware: Verify authentication
    ↓
API Route: Extract prompt and parameters
    ↓
lib/gemini.ts: Call Vertex AI
    ↓
Model: gemini-3-pro-image-preview
    ↓
Generate image (base64)
    ↓
lib/gcs.ts: Upload to Cloud Storage
    ↓
Return GCS URI to client
    ↓
Frontend: Display image in scene card
    ↓
lib/firestore.ts: Save scenario to database
```

#### 3. Video Generation Flow

```
User clicks "Generate Next" or scene video button
    ↓
Frontend: POST /api/generate-video
    ↓
Middleware: Verify authentication
    ↓
API Route: Extract scene index and model
    ↓
lib/veo.ts: Call Vertex AI
    ↓
Model: veo-3.1-generate-001 or veo-3.1-fast-generate-001
    ↓
Parameters:
  - prompt: scene.videoPrompt
  - referenceImage: scene.imageGcsUri
  - generateAudio: true/false
    ↓
Submit video generation job
    ↓
Poll job status (exponential backoff)
    ↓
Job complete: Get video GCS URI
    ↓
Return video URI to client
    ↓
Frontend: Update scene with video
    ↓
lib/firestore.ts: Update scenario in database
```

#### 4. Story Management Flow

```
Load Stories:
  GET /api/scenarios
    ↓
  lib/firestore.ts: Query scenarios collection
    ↓
  Filter: userId == session.user.id
    ↓
  Order by: updatedAt DESC
    ↓
  Return: List of scenarios

Create Story:
  POST /api/scenarios
    ↓
  Validate: User authenticated
    ↓
  lib/firestore.ts: Create document
    ↓
  Set: userId, createdAt, updatedAt
    ↓
  Return: New scenario ID

Update Story:
  PUT /api/scenarios/[id]
    ↓
  Validate: User owns scenario
    ↓
  lib/firestore.ts: Update document
    ↓
  Set: updatedAt = now()
    ↓
  Return: Success

Delete Story:
  DELETE /api/scenarios/[id]
    ↓
  Validate: User owns scenario
    ↓
  lib/firestore.ts: Delete document
    ↓
  lib/gcs.ts: Delete associated media files
    ↓
  Return: Success
```

## Component Architecture

### Main Application (app/page.tsx)

```typescript
MainPage
├── State Management
│   ├── scenarios (list of stories)
│   ├── currentScenario (active story)
│   ├── activeTab (storyboard/editor)
│   └── generatingScenes (Set of scene indices)
├── Handlers
│   ├── handleGenerateImage(index)
│   ├── handleGenerateVideo(index, model, audio)
│   ├── handleGenerateAllVideos(model, audio)
│   ├── handleSaveScenario()
│   └── handleDeleteScenario(id)
└── UI Components
    ├── Header (title, user menu)
    ├── StoryList (sidebar)
    ├── TabNavigation (storyboard/editor)
    └── StoryboardTab / EditorTab
```

### Storyboard Tab (app/components/storyboard/storyboard-tab.tsx)

```typescript
StoryboardTab
├── Props
│   ├── scenario: Scenario
│   ├── onGenerateVideo(index, model, audio)
│   ├── onUpdateScene(index, scene)
│   └── onAllVideosComplete()
├── State
│   ├── selectedModel (Veo model)
│   ├── viewMode (grid/list)
│   └── generatingScenes (Set)
├── Features
│   ├── Model Selection Dropdown
│   │   └── VEO_MODEL_OPTIONS array
│   ├── Generate Next Button
│   │   └── handleGenerateNext()
│   ├── Complete & Edit Button
│   │   └── Enabled when all videos ready
│   └── Scene Grid/List
│       └── SceneData components
└── Logic
    └── handleGenerateNext()
        ├── Find first scene with image but no video
        ├── Call onGenerateVideo(index, model, audio)
        └── Update generatingScenes state
```

### Scene Card (app/components/storyboard/scene-data.tsx)

```typescript
SceneData
├── Props
│   ├── scene: Scene
│   ├── index: number
│   ├── onGenerateVideo()
│   ├── onRegenerateImage()
│   └── onUploadImage(file)
├── Display Modes
│   ├── Image Mode
│   │   ├── Show GcsImage component
│   │   └── Hover: Generate Video button
│   └── Video Mode
│       ├── Show VideoPlayer component
│       └── Hover: Regenerate Video button
├── Controls (hover overlay)
│   ├── Regenerate Image button
│   ├── Upload Image button
│   ├── Edit Prompt button
│   └── Delete Scene button
└── Status Indicators
    ├── Loading spinner (isGenerating)
    └── Error message (if failed)
```

## Data Models

### Scenario (Story)

```typescript
interface Scenario {
  id: string;                    // Firestore document ID
  userId: string;                // Owner's Google user ID
  title: string;                 // Story title
  aspectRatio: '16:9' | '9:16';  // Video aspect ratio
  scenes: Scene[];               // Array of scenes
  createdAt: Timestamp;          // Creation time
  updatedAt: Timestamp;          // Last update time
}
```

### Scene

```typescript
interface Scene {
  imagePrompt: ImagePrompt;      // Image generation prompt
  videoPrompt: VideoPrompt;      // Video generation prompt
  imageGcsUri?: string;          // Generated image URL
  videoUri?: string;             // Generated video URL
  duration?: number;             // Video duration (seconds)
}
```

### Image Prompt

```typescript
interface ImagePrompt {
  prompt: string;                // Text description
  negativePrompt?: string;       // What to avoid
  aspectRatio: string;           // Image dimensions
  numberOfImages: number;        // How many to generate
  seed?: number;                 // Random seed
}
```

### Video Prompt

```typescript
interface VideoPrompt {
  prompt: string;                // Video description
  negativePrompt?: string;       // What to avoid
  duration: number;              // Video length (seconds)
}
```

## API Endpoints

### Authentication

- `GET /api/auth/signin` - Sign-in page
- `GET /api/auth/callback/google` - OAuth callback
- `GET /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

### Scenarios (Stories)

- `GET /api/scenarios` - List user's scenarios
- `POST /api/scenarios` - Create new scenario
- `GET /api/scenarios/[id]` - Get scenario by ID
- `PUT /api/scenarios/[id]` - Update scenario
- `DELETE /api/scenarios/[id]` - Delete scenario

### Generation

- `POST /api/generate-image` - Generate image with Gemini 3 Pro
- `POST /api/generate-video` - Generate video with Veo 3.1
- `POST /api/export-video` - Export final video composition

### Users

- `GET /api/users/me` - Get current user info
- `PUT /api/users/me` - Update user preferences

## State Management

### Client-Side State (React)

```typescript
// Local component state
const [scenarios, setScenarios] = useState<Scenario[]>([]);
const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
const [activeTab, setActiveTab] = useState<'storyboard' | 'editor'>('storyboard');
const [generatingScenes, setGeneratingScenes] = useState<Set<number>>(new Set());

// TanStack Query for server state
const { data: scenarios } = useQuery({
  queryKey: ['scenarios'],
  queryFn: fetchScenarios
});
```

### Server-Side State (Firestore)

```
Collection: scenarios
├── Document: {scenarioId}
│   ├── userId: string
│   ├── title: string
│   ├── scenes: Scene[]
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
└── Index: (userId ASC, updatedAt DESC)
```

### Session State (NextAuth)

```typescript
// Stored in encrypted JWT cookie
interface Session {
  user: {
    id: string;        // Google user ID
    email: string;     // User email
    name: string;      // Display name
    image: string;     // Profile picture
  };
  expires: string;     // Session expiration
}
```

## Security Architecture

### Authentication Layer

```
Request → Middleware (middleware.ts)
    ↓
Check session cookie
    ↓
If no session: Redirect to /sign-in
    ↓
If session exists: Verify JWT signature
    ↓
Decode user info from token
    ↓
Attach to request context
    ↓
Continue to API route
```

### Authorization Layer

```
API Route Handler
    ↓
Get session: await auth()
    ↓
Extract userId from session
    ↓
Query Firestore with userId filter
    ↓
Verify user owns resource
    ↓
If authorized: Process request
    ↓
If not: Return 403 Forbidden
```

### Email Whitelist

```
Google OAuth Callback
    ↓
auth.ts: signIn callback
    ↓
Extract email from profile
    ↓
Check ALLOWED_EMAIL_DOMAINS
    ↓
Check ALLOWED_EMAILS
    ↓
If match: return true (allow)
    ↓
If no match: return false (deny)
    ↓
User sees "Access Denied" page
```

## Performance Optimizations

1. **Image Optimization**
   - Next.js Image component with automatic optimization
   - Lazy loading with `loading="lazy"`
   - Responsive images with `srcset`

2. **Code Splitting**
   - Automatic route-based code splitting
   - Dynamic imports for heavy components
   - Separate chunks for vendor libraries

3. **Caching Strategy**
   - TanStack Query for server state caching
   - Stale-while-revalidate for scenarios
   - GCS signed URLs with 1-hour expiration

4. **API Optimization**
   - Exponential backoff for AI API calls
   - Parallel video generation support
   - Batch Firestore operations

5. **Cloud Run Scaling**
   - Min instances: 0 (cost optimization)
   - Max instances: 100 (handle traffic spikes)
   - Concurrency: 80 requests per instance
   - CPU allocation: 2 vCPU
   - Memory: 4 GiB

## Error Handling

### Client-Side

```typescript
try {
  const response = await fetch('/api/generate-video', {
    method: 'POST',
    body: JSON.stringify({ sceneIndex, model })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const data = await response.json();
  updateScene(sceneIndex, { videoUri: data.videoUri });
  
} catch (error) {
  console.error('Video generation failed:', error);
  showErrorToast('Failed to generate video');
  setGeneratingScenes(prev => {
    const next = new Set(prev);
    next.delete(sceneIndex);
    return next;
  });
}
```

### Server-Side

```typescript
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { sceneIndex, model } = await request.json();
    
    // Generate video
    const videoUri = await generateVideo(prompt, model);
    
    return NextResponse.json({ videoUri });
    
  } catch (error) {
    logger.error('Video generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Logging and Monitoring

- **Application Logs**: Cloud Logging (stdout/stderr)
- **Error Tracking**: Console errors logged to Cloud Logging
- **Performance Metrics**: Cloud Run metrics (latency, requests, errors)
- **Custom Logging**: `app/logger.ts` with log levels (debug, info, warn, error)

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
