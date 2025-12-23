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

Using configuration file:
```bash
bash deploy.sh
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
