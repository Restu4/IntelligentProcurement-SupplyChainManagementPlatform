# Expo Demo Script
## SmartProcure AI — Live Demonstration Walkthrough

**Duration:** 10-12 minutes
**Presenter:** Restu Mahi
**Setup:** Laptop with SmartProcure AI running (localhost or cloud), projector display

---

## [0:00-0:30] Introduction

> "Good morning/afternoon everyone. My name is Restu Mahi, and today I'm excited to present **SmartProcure AI** — an Intelligent Procurement & Supply Chain Assistant powered by Artificial Intelligence.
>
> SmartProcure AI transforms how procurement professionals interact with their data. Instead of manually searching through documents, policies, and spreadsheets, they can simply ask questions in natural language and get instant, sourced answers."

---

## [0:30-1:30] Login & Dashboard

**Action:** Open browser, navigate to SmartProcure AI, login with admin/admin123

> "Let me show you the platform. After logging in, we're greeted by the **Dashboard** — our central command center.
>
> Here we see key metrics: Total Budget at Rp125 billion, Budget Remaining, Total Suppliers (128), High Risk Suppliers, Purchase Orders, and Average Procurement Time.
>
> The spending chart shows our monthly actual vs forecast spending. And on the right, we have recent platform activities."

**Action:** Hover over chart points, scroll through activities

---

## [1:30-3:30] AI Assistant — Core RAG Demo

**Action:** Navigate to AI Assistant in sidebar

> "Now let's experience the core feature — the **AI Assistant**. This is a Retrieval-Augmented Generation system that answers questions based on our procurement knowledge base.
>
> Let me ask: **'Who is the best supplier?'** "

**Action:** Type "Who is the best supplier?" and send

> "Notice how the AI responds with the answer from our Supplier Evaluation Report: PT ABC is the Best Supplier 2025 with a Delivery Score of 95 and Quality Score of 90.
>
> We get a **92% confidence score** and we can expand the **Sources** panel to see the exact document excerpt that was used."

**Action:** Click on "1 source" to show the source panel

> "This is critical for enterprise use — every answer is traceable back to its source document. No black box AI."

**Action:** Ask "What are the procurement approval limits?"

> "The AI pulls from our Procurement SOP document. It tells us: below Rp10M needs Supervisor approval, Rp10M-Rp50M needs Manager approval, and above Rp50M needs Director approval."

**Action:** Ask "What happens if a supplier delivers late?"

> "From the SOP: delays over 30 days incur a 10% penalty from contract value. Notice the 88% confidence score."

---

## [3:30-4:30] Hallucination Protection Demo

> "One of the most important features is **Hallucination Protection**. Let me show you."

**Action:** Type "What is the company's policy on international shipping?"

> "Since this information doesn't exist in our knowledge base, the confidence score is below 70%, and the system honestly says: 'I'm sorry, this information does not exist in the SmartProcure Knowledge Base.'
>
> The system **never invents** procurement information. This is crucial for compliance and trust."

---

## [4:30-5:30] Document Upload

**Action:** Navigate to Knowledge Base

> "Our system can learn from any procurement document. Let me upload a new file."

**Action:** Drag a PDF or select Browse Files

> "SmartProcure automatically:
> 1. Extracts text from the document
> 2. Splits it into intelligent chunks
> 3. Generates vector embeddings
> 4. Stores everything in our vector database
>
> The document is immediately searchable via the AI Assistant."

---

## [5:30-6:30] Supplier Intelligence

**Action:** Navigate to Supplier Intelligence

> "Let's look at **Supplier Intelligence**. Here we see all suppliers with their performance metrics.
>
> We have delivery and quality scores visualized as progress bars. Risk levels are color-coded: green for low, yellow for medium, red for high risk.
>
> Notice PT XYZ — they have a 70% delivery score and 75% quality score, classified as **High Risk**."

**Action:** Click on a supplier or risk assessment

> "The risk classification is AI-powered, considering delivery performance, quality scores, and late delivery ratios."

---

## [6:30-7:30] Budget Tracker

**Action:** Navigate to Budget Tracker

> "Our **Budget Tracker** shows procurement budget allocation across departments.
>
> Each department shows the budget, spent amount, remaining funds, and utilization percentage.
>
> The progress bar changes color based on utilization — green for healthy, yellow for warning, red for critical. This gives procurement managers instant visibility into budget health."

---

## [7:30-8:30] AI Forecasting

**Action:** Navigate to Forecast

> "The **AI Forecast** page demonstrates our predictive capabilities.
>
> We see the Price Prediction chart — blue dashed line shows the AI forecast, green line shows actual historical prices. The model predicts prices will continue rising.
>
> The **Smart Buy Recommendation** panel shows each supplier ranked by a composite score. PT Karya Mandiri leads with 94%, making them the recommended choice based on delivery, quality, and price competitiveness.
>
> This helps procurement managers make data-driven purchasing decisions."

---

## [8:30-9:30] Mobile App

**Action:** Show mobile app on phone/emulator

> "SmartProcure AI also comes with a **Flutter mobile app** using Material 3 design.
>
> We have a login screen, dashboard with key stats, AI chat interface, document upload, supplier risk visualization, budget summary, notifications, and settings.
>
> Procurement managers can monitor their operations on the go."

---

## [9:30-10:00] Architecture Discussion

> "Let me briefly touch on the architecture:
>
> **Backend:** FastAPI with async SQLAlchemy for PostgreSQL, ChromaDB for vector search, Sentence Transformers for embeddings, Google Gemini for LLM generation
>
> **Frontend:** Next.js 14 with TailwindCSS, dark/light mode, responsive design
>
> **Mobile:** Flutter 3 with Material 3
>
> The system is fully containerized with Docker and ready for production deployment."

---

## [10:00-10:30] Conclusion

> "In summary, SmartProcure AI delivers:
>
> ✅ AI-powered procurement Q&A with sourced answers
> ✅ Hallucination protection for reliable responses
> ✅ Supplier intelligence with risk classification
> ✅ AI forecasting for data-driven decisions
> ✅ Enterprise-grade architecture
> ✅ Modern, premium UI/UX
>
> Thank you for your attention. I'm happy to answer any questions and show a live demo."

---

## [10:30+] Q&A Preparation

**Anticipated Questions:**

| Question | Answer |
|----------|--------|
| How is this different from ChatGPT? | SmartProcure is a RAG system — it only answers from your specific procurement documents. ChatGPT is a general model that may hallucinate. Our system shows source citations. |
| Can it handle multiple languages? | Currently optimized for Indonesian and English. Gemini supports 30+ languages. |
| How much does it cost to run? | Main cost is Gemini API. For moderate use (~1000 queries/month), approximately $5-10/month. |
| Can it integrate with SAP/Oracle? | The architecture supports integration via REST API. ERP integration is on the roadmap. |
| Is it secure for enterprise use? | Yes. JWT authentication, bcrypt passwords, role-based access, and all data is self-hosted. |

---

## Technical Setup Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Sample documents loaded in ChromaDB
- [ ] Mobile app ready on phone/emulator
- [ ] Projector/laptop display configured
- [ ] Internet connection for Gemini API
- [ ] Backup: recorded demo video (in case of connectivity issues)
- [ ] Business cards / contact info ready
