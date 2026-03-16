# 🧰 Waypoint Franchise Advisors — Tech Stack

> **Last Updated:** March 2026  
> A complete reference for every tool, platform, and service used across the Waypoint Franchise Advisors business and tech operations.

---

## 🏗️ Core Infrastructure

| Tool | Category | Purpose |
|------|----------|---------|
| **Waypoint CRM** | CRM | Custom-built internal CRM for managing leads, clients, and franchise advisory workflows |
| **Vercel** | Hosting / Deployment | Hosts and auto-deploys the Waypoint web application and dashboards via GitHub integration |
| **Cloudflare** | Domain / DNS | Domain management, DNS routing, and security/CDN layer for all Waypoint web properties |
| **GA4** | Analytics | Google Analytics 4 for tracking website traffic, user behavior, and conversion events |

---

## 🤖 AI & Automation

| Tool | Category | Purpose |
|------|----------|---------|
| **ChatGPT** | AI Assistant | General-purpose AI for content creation, research, and lead/model registration workflows |
| **Claude** | AI Assistant | Long-form writing, analysis, and complex reasoning tasks |
| **Claude Co-Work** | AI Collaboration | Collaborative AI workspace for shared team projects and iterative document drafting |
| **Grok** | AI Assistant | Real-time information retrieval and social/market trend analysis |
| **Perplexity** | AI Research | AI-powered web search and research synthesis |
| **Gemini** | AI Assistant | Google's AI for multimodal tasks, integration with Google Workspace |
| **Antigravity** | AI Coding Agent | Agentic AI coding assistant (this tool) for building, debugging, and managing codebases |
| **NotebookLM** | AI Research | Google's AI notebook for synthesizing long documents, PDFs, and research sources |
| **n8n** | Automation / Workflow | Low-code workflow automation platform connecting apps, webhooks, and APIs |
| **Apify** | Web Scraping / Automation | Web scraping and data extraction automations for lead generation and research |

---

## 📣 Video & Content Creation

| Tool | Category | Purpose |
|------|----------|---------|
| **YouTube Studio** | YouTube Management | Managing the Waypoint YouTube channel, analytics, video publishing, and monetization |
| **vidIQ** | YouTube Growth | YouTube SEO, keyword research, competitor analysis, and video performance optimization |
| **Subscribr** | YouTube AI | AI-powered YouTube script writing, research, and channel growth strategy |
| **Descript** | Video / Podcast Editing | AI-powered video and audio editing with transcription, overdub, and screen recording |
| **Higgsfield** | AI Video Generation | AI-powered cinematic video generation for marketing and social content |
| **HeyGen** | AI Avatar Video | AI avatar and talking-head video creation for personalized outreach and presentations |
| **ElevenLabs** | AI Voice / Audio | AI voice cloning and text-to-speech for video narration and audio content |
| **Opus Clip** | Video Repurposing | AI-powered long-form video clipping and repurposing for short-form content |
| **CapCut** | Video Editing | Mobile and desktop video editing for reels, shorts, and social media posts |
| **OBS** | Screen / Live Recording | Open Broadcaster Software for screen recording, live streaming, and webinar capture |
| **Lovart** | AI Creative / Design | AI-powered creative design and visual content generation |
| **Replicate** | AI Model Hosting | Runs open-source AI image/video/audio models via API for custom media generation |
| **Canva** | Design | Graphic design platform for presentations, social graphics, and brand materials |
| **Image Upscaler** | Image Enhancement | AI image upscaling and enhancement for high-resolution marketing visuals |

---

## 🎙️ Audio & Meetings

| Tool | Category | Purpose |
|------|----------|---------|
| **Plaud.ai** | Audio Recording | AI-powered voice recorder for capturing and transcribing meetings and calls |
| **Whisper Flow** | Voice Transcription | Real-time AI transcription and dictation tool powered by OpenAI Whisper |
| **Zoom** | Video Conferencing | Client discovery calls, team meetings, and webinars |
| **Google Meet** | Video Conferencing | Internal team video calls and Google Workspace-integrated meetings |

---

## 📊 Productivity & Collaboration

| Tool | Category | Purpose |
|------|----------|---------|
| **Google Sheets** | Spreadsheets | Data tracking, lead lists, reporting dashboards, and operational data management |
| **Google Slides** | Presentations | Pitch decks, investor presentations, and franchise discovery day materials |
| **Google Docs** | Documents | SOPs, proposals, contracts, and collaborative writing |
| **Adobe Acrobat** | PDF Management | PDF creation, electronic signatures (e-sign), and document management |
| **Slack** | Team Communication | Internal team messaging, project channels, and integrations hub |
| **Telegram** | Messaging | External communications and quick async messaging with partners/clients |
| **WhatsApp** | Messaging | Client and partner communication, especially international contacts |

---

## 📱 Social Media & Publishing

| Tool | Category | Purpose |
|------|----------|---------|
| **Typefully** | Social Publishing | Twitter/X and LinkedIn content scheduling, thread drafting, and analytics |
| **beehiiv** | Email Newsletter | Newsletter platform for building and monetizing the Waypoint subscriber audience |

---

## 🎯 Sales & Lead Generation

| Tool | Category | Purpose |
|------|----------|---------|
| **Clay** | Lead Enrichment | AI-powered lead enrichment, data sourcing, and outreach personalization at scale |
| **Apollo** | Lead Database / Outreach | B2B contact database and email/LinkedIn outreach sequencing |
| **Instantly** | Cold Email Outreach | Cold email sending platform with deliverability optimization and campaign sequencing |
| **Resend** | Transactional Email | Developer-friendly email API for sending transactional and automated emails |
| **TidyCal** | Booking / Scheduling | Lightweight calendar booking tool for scheduling client discovery calls and consultations |

---

## 📐 Architecture Overview

```
Domain (Cloudflare)
    └── Web App (Vercel)
            └── Waypoint CRM (Custom Build)
                    ├── Lead Pipeline → Apollo / Clay / Instantly
                    ├── Automation → n8n
                    ├── Booking → TidyCal
                    ├── Email → Resend
                    └── Data → Google Sheets → GA4

Content / Media Pipeline:
    Plaud.ai / Whisper Flow → NotebookLM → ChatGPT / Claude
    → Canva / HeyGen / Higgsfield / ElevenLabs / Descript
    → Opus Clip / CapCut / OBS
    → YouTube Studio (vidIQ / Subscribr) + Typefully + beehiiv
```

---

## 📝 Notes

- **Waypoint CRM** is a custom-built system — see the `waypoint-core-system` repository for source code.
- **Antigravity** (this AI agent) is the primary development tool for building and maintaining all custom code.
- All infrastructure changes should be version-controlled via GitHub and deployed through **Vercel**.
