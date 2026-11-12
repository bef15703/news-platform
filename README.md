# AI Driven News and Information Platform

The purpose of this project is to explore how AI can be used to automate news, editorial, and information distribution workflows. The central idea behind the project is to pull and cluster news feeds from a wide variety of media sources using RSS and AI embedding vectors to track top headlines. AI is then used to synthesize key points as well as extract related entities to the story for each event cluster.

## Contents
- [Architecture](#architecture)

- [Features](#features)

- [Tech Stack](#tech-stack)

- [Local Deployment](#local-deployment)

- [Directory Layout](#directory-layout)

## Architecture

```text
[ RSS Feeds ]
        │
        ▼
[ Worker Service ] ──(HNSW Vector Cosine Ops)──► [ Postgres + pgvector ]
        │                                                    │
 (Gemini LLM API)                                            │
        │                                                    ▼
 [ Event Synthesis ] ──(SDUI JSON & Decks)──► [ Editorial Studio (Dashboard) ]
                                                             │
                                                             ▼
                                                    [ iOS Mobile App ]
```
## Features

- __Automated Wire Ingestion and Vector Clustering:__ Polls RSS feeds from multiple sources, generates 768-dimensional embeddings using `gemini-embedding-2` model, and groups related articles via `pgvector` HNSW cosine similarity before editorial review.

- __LLM Event and Entity Synthesis:__ Uses Gemini `gemini-3.8-flash` model with strict schema validation to generate executive ledes, multi-card story carousels (`deck_json`), modular article blocks (`sdui_blocks`), and extract related entities.

- __Editorial Studio:__ Provides editors with a dual-mode live mobile emulator (full-screen story cards and scrollable article feed) alongside real-time SDUI block and template controls.

- __Entity Info Sheets:__ Maintains canonical profiles for people, agencies, companies, and locations with trigram autocomplete search and deployable context warning banners. Entity information and images can be autofilled using the Wikipedia REST and Actions APIs.

- __Native iOS Reader:__ Consumes structured SDUI payloads directly in SwiftUI to render interactive story decks and dynamic article widgets without client-side updates.

## Tech Stack
| Layer | Technologies | Role in Architecture |
| :--- | :--- | :--- |
| Monorepo & Tooling | Turborepo, pnpm, TypeScript | Orchestrates parallel builds across workspaces (`apps/`, `services/`, `packages/`) and enforces end-to-end type safety across shared database contracts. |
| Editorial Dashboard | Next.js, React, Tailwind CSS | Powers the split-pane Event Studio, live mobile viewport emulator, ingest triage queue, and semantic design-token theme system. |
| Database & Search | PostgreSQL, `pgvector`, `pg_trgm`, Kysely | Stores raw wire articles, normalized events, and entity objects; uses HNSW cosine vector indexes (`VECTOR(768)`) for semantic story clustering and trigram GIN indexes for instant entity autocomplete. |
| Ingestation & AI Worker | Node.js, Gemini API | Polls RSS wire feeds, generates article embeddings, clusters correlated coverage, and synthesizes structured deck_json carousels, sdui_blocks, and extracted entities with strict schema validation. |
| Mobile Client | Swift, SwiftUI | Native iOS reader rendering full-screen story card carousels, dynamic SDUI article blocks, and entity info sheets. |
| Infrastructure | Docker, Docker Compose | Provisions reproducible local PostgreSQL instances preloaded with vector and trigram extensions. |


## Local Deployment 

### Prerequisites

- Node.js
- pnpm 
- Docker
- Docker Compose

### Setup Steps

1. Clone the repository
```bash
$ git clone https://github.com/bef15703/news-platform.git
$ cd news-platform
```

2. Install Dependancies
```bash
$ pnpm install
```

3. Create `.env` in the project root
```ino
DATABASE_URL="postgres://<username>:<password>@localhost:<port>/news_platform"
GEMINI_API_KEY=<Your API Key>
```

4. Start PostgreSQL
```bash
$ docker compose up -d
```
5. Launch Services
```bash
$ pnpm dev
```
## Directory Layout
```text
.
├── apps
│   ├── dashboard                 
│   │   ├── src
│   │   │   ├── app
│   │   │   │   ├── entities         
│   │   │   │   ├── events/[id]      
│   │   │   │   └── ingest          
│   │   │   ├── components           
│   │   │   └── lib                
│   │   └── tailwind.config.ts
│   └── ios
│       └── news_platform_ios       
├── packages
│   └── db                         
│       ├── migrations/001_initial_schema.sql
│       └── src
├── services
│   └── worker                      
│       └── src
├── docker-compose.yml
├── package.json
└── turbo.json
```