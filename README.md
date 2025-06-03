# FinSight
**AI-Powered Personal Finance & Investing Assistant with Risk Intelligence**

FinSight is an all-in-one personal finance and investing assistant designed to make first-time investing less intimidating and a lot more insightful. Combining real-time data, intuitive design, and explainable AI, FinSight turns financial curiosity into confident action — no jargon, no black boxes.

---
## How to run
### Clone the repo
1. Please clone the repo before further steps.
2. Checkout to main branch, if not already on it

### Populate .env
1. Update .env at the root with perplexity API key, like so
```
PERPLEXITY_API_KEY=pplx-4khsHA522Lt3AL1tDbZ8gXKdsssFBt12343K78FV5789yas57s1
# rest of the config can be unchanged
```
2. Update .env at ```frontend/``` with localhost:<port>, only if you changed port of backend from the default 8000.
```
REACT_APP_API_URL=http://localhost:8000
```
### Install Docker
You can install docker for easier experience. or follow the section mentioning 'Run without docker'.

### Docker command
make sure to be in the root of repo.
 
```docker compose up --build -d```

### Run without docker
#### Starting frontend
```
cd frontend
npm i
npm run start
```
Open new terminal, dont close previous one
#### Starting backend
```
cd backend
pip install -r requirements.txt
uvicorn api.main:app --reload --env-file ../.env
```
---
### App access
**We have hosted the same experience on https://perplexity.enduku.life on our own server, as a part of learning and experimenting how to deploy an app.**
1. Go to http://localhost to access frontend
2. or you can go to http://localhost:8000/docs for backend's swagger UI

### Getting Started
1. Only the home page and guide page can be viewed without logging in or an account.
2. To have full experience please register an account, at this stage to guarantee anonymity we have not added email checks. so feel free to use a random email while signing up.
3. Once logged in, be sure to remember password and login with it.
4. Now you can access the entire application, be sure to explore and checkout all the features, especially highlighted features, we are so proud of them.
5. You will be occasionally logged out, roughly after 30mins from login, for security purposes. You will need to re-login to continue.

_Be sure to write to us for any concerns, issues or clarifications. Thanks!_
## Features

### 1. Real-Time Market News
Stay updated with an AI-curated news feed tailored to your watchlist. Powered by Perplexity’s Sonar API, the feed pulls citation-backed stories and ties them contextually to the stocks you track.

### 2. Visual Asset Tracker
An interactive dashboard that displays:

- Live price movements and daily/weekly change indicators  
- Mini trend graphs for quick insights  
- Latest stock-specific news  
- Industry classification  
- Expandable **Risk Insight** panel for deeper analysis  

Everything you need to understand your assets — at a glance.

### 3. Conversational Chat Assistant
Your 24/7 investing companion. Ask questions, get explanations, or explore strategies — all in plain, friendly language. Perfect for demystifying complex terms or brainstorming investment ideas.

### 4. Guide to the Curious
A beginner-first educational space featuring:

- Country-specific onboarding (India/US)  
- Walkthroughs for account setup, taxes, and regulations  
- Step-by-step investing guides  
- AI assistant support while reading  

No guesswork — just guidance that adapts to your context.

### 5. AI Risk Analysis Engine (New in v2)
Go beyond price tracking. The risk engine offers real-time, explainable insights across:

- **Volatility Trends**: Historical and implied volatility metrics  
- **Sector Stability**: Resilience of the broader industry  
- **Sentiment Signals**: AI-powered read on market mood via options activity and analyst chatter  

Risk levels are color-coded, educational, and fully transparent — no black-box ratings.

---
## What Makes FinSight Different

- **Beginner-Friendly** from the ground up — no assumptions, no intimidating charts  
- **Country-Sensitive** with tailored onboarding for Indian and US users  
- **Self-Contained Learning Loop**: Track → Read → Understand Risk → Act → Learn  
- **Explainable AI** that teaches, not just tells  
- **Relaxed, Visual UI** designed to encourage curiosity, not overwhelm  

---

## Who It’s For

- New investors unsure where to start  
- Indian or US users navigating unique investing hurdles (KYC, tax, brokers)  
- Side learners who want to understand **why** a stock moves — not just that it does  
- Curious explorers who learn best by doing, not by memorizing theory  

---

## What’s Coming Next

FinSight is built with scalability in mind. Future plans include:

- Portfolio performance tracking  
- Paper trading/simulated investments  
- Personalized, AI-driven alerts  
- Social and community features  

---

## Core Belief

**FinSight doesn’t just track stocks — it teaches, explains, and grows with you.**  
From anxiety to insight, from confusion to clarity — it’s your confidence engine.

## Technical Stack

* **Frontend:** React + Tailwind CSS
* **Backend:** Python FastAPI
* **Charts:** Chart.js or D3.js
* **Database:** MongoDB (Optional - for user data, preferences, etc.)
* **Deployment:** Docker
* **CI/CD:** GitHub Actions

## Potential Impact

FinSight aims to empower first-time investors and young professionals by:

* **Democratizing Access to Sophisticated Financial Analysis:** Providing insights previously only available to experienced investors.
* **Improving Financial Literacy:** Educating users on key financial concepts with clear reasoning and reliable sources.
* **Fostering Informed Decision-Making:** Enabling users to understand the "why" behind financial recommendations and market movements.
* **Building Confidence in Managing Finances:** Providing a clear and understandable overview of their financial situation and potential pathways to achieving their goals.

## Judging Criteria Alignment

* **Technological Implementation:** FinSight leverages the advanced features of the Sonar API (Deep Research, reasoning capabilities) at its core. The chosen tech stack demonstrates quality software development practices and scalability.
* **Design:** The focus on a simple and clean interface, combined with informative visualizations, ensures a positive user experience and a balanced blend of frontend and backend functionality.
* **Potential Impact:** By targeting first-time investors and young professionals, FinSight addresses a significant need for accessible and understandable financial guidance, potentially fostering better financial habits early in their lives.
* **Quality of the Idea:** The concept of a "Perplexity for Finance" that provides reasoning and context for financial information is innovative. By focusing on a specific demographic and leveraging Sonar's unique capabilities, FinSight offers a significant improvement over generic financial tracking apps.

## Future Considerations

* Integration with brokerage APIs (with user consent and security measures) for seamless portfolio tracking and execution.
* Advanced goal-setting features with AI-powered projections and recommendations.
* Personalized risk assessment tools integrated with Sonar's analytical capabilities.
* Expansion to support other financial goals like retirement planning and debt management.

## Getting Started

(Instructions on how to set up and run the project will be added here during development)

## Team

Sasank Madati
Hruthik Madati

## License

MIT License
