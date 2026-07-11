// WARDEN.AI's entire brain — a purely local data store, no LLM, no network.
// Everything the terminal can say lives in this one file so updating the
// bot means editing data here, never touching Terminal.jsx's rendering or
// typewriter logic. Content mirrors my cv.pdf; keep the two in sync.
//
// Two layers, checked in order by resolveResponse():
//   1. COMMANDS  — exact-match words (the classic terminal verbs).
//   2. TOPICS    — natural-language questions, resolved by keyword scoring:
//      every keyword hit scores 1, every (longer) phrase hit scores 3, and
//      the highest-scoring topic above zero wins. Substring phrases let
//      "is he open to freelance work?" outrank a stray keyword collision.

export const CV_PDF_URL = '/muzammil-cv.pdf';

export const COMMAND_LIST = ['help', 'about', 'projects', 'skills', 'cv', 'contact', 'whoami', 'clear'];

export const COMMANDS = {
  help: () => [
    `Available commands: ${COMMAND_LIST.join(', ')}`,
    "Or simply ask — 'what does he do', 'is he available for hire', 'tell me about the pharmacy project'.",
  ],
  about: () => [
    'Muhammad Muzammil — Junior AI Automation Engineer at Wanile Technologies, Lahore.',
    'Software Engineering graduate (University of Lahore, 2021-2025).',
    'Designs end-to-end automated systems connecting applications, data sources, and AI services.',
  ],
  projects: () => [
    '01 AI-Powered Workflow Automation — n8n + Zapier pipelines wiring forms, email, Sheets, and AI services.',
    '02 Pharmacy Management System — full-stack app: auth, inventory, prescriptions, billing, analytics.',
    '03 MCP Server Integrations — Claude wired to local files, APIs, and external services.',
    '04 AI Content & Data Pipelines — automated generation, extraction, and intelligent routing.',
    "Ask about any of them by name — e.g. 'tell me about the mcp work'.",
  ],
  skills: () => [
    'AI & Automation: n8n, Zapier, Workflow Automation, AI Agents, Claude, ChatGPT, Prompt Engineering',
    'Integrations & APIs: REST APIs, Webhooks, MCP Servers, Google Sheets, Third-Party Systems',
    'Development: JavaScript, HTML, CSS, Git & GitHub · Tools: Postman, Windsurf IDE, VS Code',
    'Certified: Microsoft Technology Associate (MTA) · Google AI Essentials',
  ],
  cv: () => ({
    lines: ['Retrieving the dossier from the archives... it should be opening now.'],
    action: 'download-cv',
  }),
  resume: () => COMMANDS.cv(),
  dossier: () => COMMANDS.cv(),
  contact: () => [
    'Email: muzamilqaiser2001@gmail.com',
    'LinkedIn: linkedin.com/in/muhammad-muzamil-b421b023b',
    'Location: Lahore, Pakistan',
  ],
  whoami: () => ['A visitor... the fog brought you here.'],
  sudo: () => ['The estate does not grant root to strangers. Nice try.'],
  fog: () => ['The fog is not a place. It is the moment before a system becomes clear. He walks it daily.'],
};

export const TOPICS = [
  {
    keywords: ['education', 'degree', 'university', 'studied', 'study', 'graduate', 'graduated', 'school', 'bs'],
    phrases: ['where did he study'],
    lines: [
      'BS in Software Engineering — University of Lahore, 2021-2025.',
      'Everything past the degree (n8n, MCP servers, AI-agent workflows) is self-directed, built on real work.',
    ],
  },
  {
    keywords: ['experience', 'career', 'wanile', 'job', 'role', 'position', 'employer', 'company'],
    phrases: ['work history', 'where does he work', 'current job'],
    lines: [
      'Junior AI Automation Engineer at Wanile Technologies, Lahore — Jan 2026 to present.',
      'Designs and deploys n8n/Zapier workflows, integrates Claude and ChatGPT into business processes,',
      'and configures MCP servers connecting AI models to files, APIs, and external services.',
    ],
  },
  {
    keywords: ['pharmacy', 'inventory', 'billing', 'prescriptions'],
    phrases: ['pharmacy management system', 'full stack project'],
    lines: [
      'Pharmacy Management System (Dec 2025 - Jan 2026) — AI-assisted full-stack build.',
      'Authentication & roles, inventory tracking, prescription management, payment processing,',
      'and an analytics dashboard. He handled UI, development, testing, and deployment.',
    ],
  },
  {
    keywords: ['mcp', 'servers'],
    phrases: ['mcp server', 'mcp work', 'model context protocol'],
    lines: [
      'MCP Server Integrations — wiring AI models to the real world.',
      'Configured MCP servers so Claude can read local files, call APIs, and drive external services —',
      'real tool access inside automation pipelines, not just chat.',
    ],
  },
  {
    keywords: ['n8n', 'zapier', 'workflows', 'pipeline', 'pipelines', 'routing', 'extraction'],
    phrases: ['workflow automation', 'automation project'],
    lines: [
      'AI-Powered Workflow Automation — his core body of work.',
      'n8n + Zapier pipelines connecting web forms, email, Google Sheets, and AI services,',
      'with intelligent routing, data extraction, and automated content generation built in.',
    ],
  },
  {
    keywords: ['stack', 'tools', 'technologies', 'tech'],
    phrases: ['tech stack', 'what does he use'],
    lines: [
      'Core stack: n8n and Zapier for orchestration; REST APIs, webhooks, and MCP servers for wiring.',
      'Claude and ChatGPT are reasoning steps inside the workflows, not bolted on after.',
      'Development: JavaScript, HTML, CSS, Git. Daily tools: Postman, Windsurf IDE, VS Code.',
    ],
  },
  {
    keywords: ['certification', 'certifications', 'certified', 'certificate', 'mta'],
    phrases: ['google ai essentials'],
    lines: ['Microsoft Technology Associate (MTA) and Google AI Essentials.'],
  },
  {
    keywords: ['hire', 'hiring', 'available', 'availability', 'freelance', 'collaborate', 'recruit'],
    phrases: ['open to work', 'work with him', 'is he available'],
    lines: [
      'Open to freelance and full-time AI automation / integration engineering work.',
      "Fastest way in: the contact form above, or type 'contact' for direct details.",
    ],
  },
  {
    keywords: ['soft', 'communication', 'teamwork', 'adaptability'],
    phrases: ['soft skills', 'problem solving'],
    lines: [
      'Soft skills, per the dossier: problem solving, communication, teamwork,',
      'adaptability, and analytical thinking. The fog demands all five.',
    ],
  },
  {
    keywords: ['where', 'location', 'lahore', 'pakistan', 'based', 'city', 'country', 'remote'],
    phrases: ['where is he', 'where does he live'],
    lines: ['Lahore, Pakistan — and comfortable working remotely with teams anywhere.'],
  },
  {
    keywords: ['email', 'mail', 'linkedin', 'reach', 'message'],
    phrases: ['how do i contact', 'get in touch'],
    lines: [
      'muzamilqaiser2001@gmail.com · linkedin.com/in/muhammad-muzamil-b421b023b',
      "Or use the contact form one section above — it opens your own mail client, nothing is stored.",
    ],
  },
  {
    keywords: ['salary', 'rate', 'price', 'cost', 'charge'],
    phrases: ['how much'],
    lines: ['The estate does not discuss numbers in the courtyard. Email him — the gate is always listening.'],
  },
  {
    keywords: ['who', 'muzammil', 'name', 'himself'],
    phrases: ['who is he', 'who are you', 'what does he do'],
    lines: [
      'Muhammad Muzammil — Junior AI Automation Engineer. He builds systems that connect',
      'applications, data, and AI models so the repetitive work disappears.',
      "I am WARDEN.AI, keeper of this estate — a local construct, no cloud behind me.",
    ],
  },
  {
    keywords: ['website', 'site', 'portfolio', 'built', 'made'],
    phrases: ['this website', 'this site', 'who built'],
    lines: [
      'This estate: React + Vite, GSAP scroll orchestration, a Web Audio engine for the rain and the voice,',
      'Three.js fog, and a scroll-scrubbed cinematic. Built by the man himself — AI-assisted, human-directed.',
    ],
  },
  {
    keywords: ['hello', 'hi', 'hey', 'greetings', 'salam', 'assalam'],
    phrases: ['good evening', 'good morning'],
    lines: ["Hello. Type 'help' if you're not sure where to start."],
  },
  {
    keywords: ['thank', 'thanks', 'shukriya'],
    phrases: ['thank you'],
    lines: ['You are welcome. The fog appreciates good manners.'],
  },
  {
    keywords: ['bye', 'goodbye', 'farewell', 'exit', 'quit'],
    phrases: ['see you'],
    lines: ['The gate stays open. Walk safely through the fog.'],
  },
];

export const UNKNOWN_RESPONSE =
  "That question is lost in the fog. Try 'help', or ask about his work, skills, projects, or availability.";

function normalize(raw) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Returns { lines: string[], action?: string }. Exact command first; then
// keyword/phrase scoring across TOPICS; UNKNOWN_RESPONSE as the floor.
export function resolveResponse(raw) {
  const cleaned = normalize(raw);
  if (COMMANDS[cleaned]) {
    const result = COMMANDS[cleaned]();
    return Array.isArray(result) ? { lines: result } : result;
  }

  const words = new Set(cleaned.split(' '));
  let best = null;
  let bestScore = 0;
  for (const topic of TOPICS) {
    let score = 0;
    for (const kw of topic.keywords) if (words.has(kw)) score += 1;
    for (const ph of topic.phrases ?? []) if (cleaned.includes(ph)) score += 3;
    if (score > bestScore) {
      bestScore = score;
      best = topic;
    }
  }
  if (best) return { lines: best.lines };
  return { lines: [UNKNOWN_RESPONSE] };
}
