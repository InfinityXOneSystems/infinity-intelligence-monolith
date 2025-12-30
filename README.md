# Infinity Intelligence System

A FAANG-level enterprise autonomous intelligence gathering system with hyperintelligent vision cortex, universal crawler, AI agents, and full cloud integration.

## Features

- **Vision Cortex**: Hyperintelligent vision analysis with taxonomy and autonomous crawling
- **Universal Crawler**: High-power web scraping and data ingestion
- **AI Agent Stack**: Headless API agents operating 24/7 in parallel
- **Auto Builder**: Autonomous system and application builder (Manus.im inspired)
- **Infinity Gateway**: Universal API gateway with chat UI
- **Orchestrator**: Coordinates all components autonomously
- **Intelligence Pipeline**: Self-crawling, validating, syncing, evolving
- **Lead Generation**: AI-powered lead generation with voice capabilities
- **Asset Prediction**: Consensus, sentiment, and global prediction systems
- **Distressed Property Finder**: Automated real estate intelligence

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vision Cortex │───▶│  Auto Builder   │───▶│  System Builds  │
│   (Brain)       │    │  (Manus.im)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│ Universal       │    │   Intelligence  │
│   Crawler       │    │   Documents     │
└─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│   AI Agents     │───▶│  Orchestrator   │
│   (Headless)    │    │                 │
└─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│ Infinity        │───▶│   Frontend      │
│   Gateway       │    │   (infinityxai) │
│   (Universal)   │    │                 │
└─────────────────┘    └─────────────────┘
```

## Prerequisites

- Node.js 18+
- Google Cloud Project with APIs enabled:
  - Cloud Vision API
  - Vertex AI
  - Firestore
  - Cloud Pub/Sub
  - Cloud Run
- GitHub repository
- Hostinger domain (infinityxai.com)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/InfinityXOneSystems/infinity-intelligence.git
cd infinity-intelligence
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Build the system:
```bash
npm run build
```

## Usage

### Local Development
```bash
npm run dev
```

### Production Deployment
```bash
npm run deploy
```

### Access the System
- Frontend: https://infinityxai.com
- API Gateway: https://infinity-intelligence-[hash]-uc.a.run.app
- Health Check: https://infinity-intelligence-[hash]-uc.a.run.app/health

## Configuration

### Google Cloud Setup
1. Enable required APIs in Google Cloud Console
2. Create service account with necessary permissions
3. Set up Firestore database
4. Configure Cloud Pub/Sub topics

### GitHub Setup
1. Add repository secrets for GCP authentication
2. Configure GitHub Actions workflows

### Domain Setup
1. Point infinityxai.com to Cloud Run service
2. Configure SSL certificates

## Autonomous Operation

The system operates autonomously with:

- **Self-crawling**: Continuously gathers intelligence from web
- **Self-validating**: Validates and cleans data
- **Self-syncing**: Syncs with Google Cloud, GitHub, Google Workspace
- **Self-evolving**: Evolves based on new data and requirements
- **Self-building**: Builds new systems and applications automatically

## API Endpoints

- `GET /health` - Health check
- `POST /api/chat` - Chat with Vision Cortex
- `POST /api/analyze` - Analyze images/documents
- `POST /api/crawl` - Trigger web crawling
- `POST /api/build` - Request system building
- `GET /api/intelligence` - Get intelligence data
- `GET /api/leads` - Get generated leads

## Monitoring

- Logs are stored in Google Cloud Logging
- Metrics available in Google Cloud Monitoring
- Intelligence reports synced to Google Workspace

## Contributing

The system is designed for autonomous operation, but contributions are welcome for:

- New agent types
- Enhanced vision capabilities
- Additional prediction models
- Improved crawler strategies

## License

Proprietary - Infinity X One Systems