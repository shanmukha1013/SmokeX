/**
 * Technologies, grouped by discipline. `usedIn` lists only places where the use is
 * documented in a public repository or in described internship work.
 */

export interface Tech {
  name: string;
  usedIn: string[];
}

export interface TechGroup {
  id: string;
  title: string;
  blurb: string;
  items: Tech[];
}

export const techGroups: TechGroup[] = [
  {
    id: "languages",
    title: "Programming",
    blurb: "The languages everything else is built on.",
    items: [
      { name: "Python", usedIn: ["FeatureFlow", "Sidekick", "PunchStart", "ContextForge"] },
      { name: "JavaScript", usedIn: ["ForReal", "Flexy"] },
      { name: "TypeScript", usedIn: ["Sidekick", "FeatureFlow", "SMOKE X"] },
      { name: "SQL", usedIn: ["FeatureFlow", "ContextForge"] },
    ],
  },
  {
    id: "frontend",
    title: "Frontend",
    blurb: "Interfaces that feel considered, fast and accessible.",
    items: [
      { name: "HTML & CSS", usedIn: ["Flexy", "SMOKE X"] },
      { name: "React", usedIn: ["ForReal", "Sidekick", "PunchStart", "SMOKE X"] },
      { name: "Next.js", usedIn: ["Sidekick", "PunchStart", "SMOKE X"] },
      { name: "Tailwind CSS", usedIn: ["ForReal", "Sidekick", "PunchStart", "SMOKE X"] },
    ],
  },
  {
    id: "backend",
    title: "Backend",
    blurb: "APIs, data models and the security details in between.",
    items: [
      { name: "FastAPI", usedIn: ["Sidekick", "PunchStart", "FeatureFlow", "ContextForge"] },
      { name: "REST APIs", usedIn: ["ForReal", "Flexy", "Sidekick", "PunchStart", "FeatureFlow"] },
      { name: "Node.js & Express", usedIn: ["ForReal", "Flexy"] },
      { name: "PostgreSQL", usedIn: ["FeatureFlow", "ContextForge"] },
      { name: "MongoDB", usedIn: ["ForReal", "Flexy", "Sidekick", "PunchStart"] },
      { name: "Redis", usedIn: ["FeatureFlow", "ContextForge"] },
      { name: "WebSockets", usedIn: ["ForReal", "Flexy"] },
    ],
  },
  {
    id: "ai",
    title: "AI Engineering",
    blurb: "From retrieval pipelines to model lifecycles.",
    items: [
      { name: "RAG", usedIn: ["WiseIN AI Support System", "Production RAG System"] },
      { name: "Embeddings & vector databases", usedIn: ["Production RAG System", "ContextForge"] },
      { name: "Qdrant", usedIn: ["ContextForge"] },
      { name: "LLM APIs (Gemini)", usedIn: ["PunchStart"] },
      { name: "scikit-learn & MLflow", usedIn: ["FeatureFlow"] },
      { name: "PyTorch", usedIn: [] },
      { name: "LangChain & LangGraph", usedIn: [] },
      { name: "Hugging Face", usedIn: [] },
    ],
  },
  {
    id: "infra",
    title: "Infrastructure",
    blurb: "Shipping, observing and keeping things running.",
    items: [
      { name: "Git & GitHub", usedIn: ["Every project"] },
      { name: "Docker", usedIn: ["FeatureFlow", "ContextForge"] },
      { name: "Vercel", usedIn: ["ForReal", "Flexy", "Sidekick", "PunchStart", "FeatureFlow"] },
      { name: "Render", usedIn: ["Flexy", "Sidekick", "PunchStart"] },
      { name: "Prometheus & Grafana", usedIn: ["FeatureFlow"] },
      { name: "GitHub Actions", usedIn: ["FeatureFlow"] },
    ],
  },
];

export const experience = {
  company: "Sanshi Network Tech Pvt. Ltd.",
  product: "WiseIN",
  type: "Internship",
  summary:
    "An internship on the WiseIN product, working across quality, documentation and AI features — from finding and reporting bugs to building a support chatbot on a RAG knowledge base.",
  areas: [
    { title: "Quality assurance", detail: "Testing product flows and verifying fixes." },
    { title: "Bug reporting", detail: "Reproducing issues and writing clear, actionable reports." },
    { title: "Product documentation", detail: "Documenting features and how the product works." },
    { title: "AI customer-support chatbot", detail: "Building an assistant that answers customer questions." },
    { title: "RAG knowledge base", detail: "Grounding the chatbot’s answers in product knowledge." },
    { title: "Email automation & recommendations", detail: "Engagement emails and recommendation logic." },
    { title: "Frontend interface work", detail: "Building and refining parts of the product UI." },
  ],
};

export const services = [
  {
    title: "Full-stack web applications",
    body: "Production web apps from database to interface — authentication, real-time features, dashboards and deployment.",
    proof: ["ForReal", "Sidekick"],
  },
  {
    title: "AI integrations",
    body: "Adding language models to an existing product in a way that is reliable, testable and genuinely useful.",
    proof: ["PunchStart"],
  },
  {
    title: "AI chatbot development",
    body: "Support and knowledge assistants that answer from your own content instead of guessing.",
    proof: ["WiseIN AI Support System"],
  },
  {
    title: "RAG systems",
    body: "Retrieval pipelines, embeddings and vector search designed for accuracy in production.",
    proof: ["ContextForge"],
  },
  {
    title: "Backend & API development",
    body: "FastAPI and Node.js services with clean contracts, solid auth and sensible data models.",
    proof: ["Sidekick", "FeatureFlow"],
  },
  {
    title: "Workflow automation",
    body: "Automating repetitive work — email flows, data pipelines and internal tools.",
    proof: ["WiseIN Email Engagement"],
  },
  {
    title: "MVP development",
    body: "Taking an idea to a working first version quickly, without cutting the corners that matter later.",
    proof: ["Flexy", "PunchStart"],
  },
  {
    title: "Custom software",
    body: "Something that doesn’t fit a category? Describe the problem and we’ll shape the product together.",
    proof: [],
  },
];
