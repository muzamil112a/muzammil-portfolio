// WARDEN.AI's entire brain — a purely local data store, no LLM, no network.
// Everything the terminal can say lives in this one file so updating the
// bot means editing data here, never touching Terminal.jsx's rendering or
// typewriter logic. Content mirrors Profile.pdf; keep the two in sync.
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
    "Or simply ask — 'what does he do', 'is he available for hire', 'tell me about the seo work'.",
  ],
  about: () => [
    'Muhammad Muzamil — Quality Assurance · UI/UX Designer · SEO · Operations (AUS).',
    'Software Engineering graduate (University of Lahore, 2021-2025).',
    'Currently at Wanile Technologies (SEO) and Tech Direct Support (NOC, Australia).',
  ],
  projects: () => [
    '01 Search Engine Optimizer — Wanile Technologies, Lahore. Keyword research, on-page and technical SEO, link-building.',
    '02 NOC — Tech Direct Support, Australia (remote). Network operations and tech support.',
    "Ask about either by name — e.g. 'tell me about the seo work' or 'tell me about the noc role'.",
  ],
  skills: () => [
    'Quality Assurance: Software Testing, Bug Identification, Usability Testing, UI/UX Design',
    'SEO: Keyword Research, On-Page SEO, Technical SEO, Link-Building Strategies',
    'Operations: Operations Management, Client Relations, NOC Support',
    'Development: JavaScript, HTML, CSS, Git & GitHub',
    'Top skills: Communication, Client Relations, Operations Management',
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
      'BS in Software Engineering, Web Development — University of Lahore, 2021-2025.',
      'That foundation carries into both his QA instincts and his SEO/technical work today.',
    ],
  },
  {
    keywords: ['experience', 'career', 'wanile', 'job', 'role', 'position', 'employer', 'company'],
    phrases: ['work history', 'where does he work', 'current job'],
    lines: [
      'Two current roles. Search Engine Optimizer at Wanile Technologies, Lahore — since Aug 2025.',
      'NOC at Tech Direct Support, Australia (remote) — since Jan 2026.',
      'At Wanile his contributions also lean into Quality Assurance: testing, bug identification, usability.',
    ],
  },
  {
    keywords: ['qa', 'quality', 'testing', 'bugs', 'usability'],
    phrases: ['quality assurance', 'software testing', 'bug identification'],
    lines: [
      'Quality Assurance — software testing and usability improvements, built on a foundation in UI design.',
      'The focus: catch critical bugs early, keep interfaces as functional as they are user-friendly.',
    ],
  },
  {
    keywords: ['seo', 'keyword', 'keywords', 'backlink', 'backlinks', 'ranking', 'rankings'],
    phrases: ['search engine optimizer', 'search engine optimization', 'on page seo', 'technical seo', 'link building'],
    lines: [
      'Search Engine Optimizer at Wanile Technologies, Lahore — Aug 2025 to present.',
      'Learning and practicing SEO fundamentals: keyword research, on-page SEO, technical SEO, and link-building strategies.',
    ],
  },
  {
    keywords: ['noc', 'network', 'monitoring'],
    phrases: ['tech direct support', 'network operations', 'operational manager'],
    lines: [
      'NOC at Tech Direct Support, Australia (remote) — Jan 2026 to present.',
      'Network operations and tech support: keeping systems monitored and client issues resolved.',
    ],
  },
  {
    keywords: ['design', 'ui', 'ux', 'interface', 'interfaces'],
    phrases: ['ui/ux', 'ui ux designer', 'user experience'],
    lines: [
      'UI/UX design is the foundation his QA work sits on — interfaces judged as much on usability as function.',
    ],
  },
  {
    keywords: ['stack', 'tools', 'technologies', 'tech'],
    phrases: ['tech stack', 'what does he use'],
    lines: [
      'Development: JavaScript, HTML, CSS, Git & GitHub — from the Software Engineering degree.',
      'Day to day now: QA testing workflows, SEO tooling (keyword research, technical audits), and NOC monitoring.',
    ],
  },
  {
    keywords: ['hire', 'hiring', 'available', 'availability', 'freelance', 'collaborate', 'recruit'],
    phrases: ['open to work', 'work with him', 'is he available'],
    lines: [
      'Open to opportunities in QA, UI/UX, SEO, and operations.',
      "Fastest way in: the contact form above, or type 'contact' for direct details.",
    ],
  },
  {
    keywords: ['soft', 'communication', 'teamwork', 'adaptability', 'client', 'relations', 'operations'],
    phrases: ['soft skills', 'client relations', 'operations management'],
    lines: [
      'Top skills, per the dossier: Communication, Client Relations, Operations Management.',
      'Also: problem solving, teamwork, adaptability, analytical thinking. The fog demands all of it.',
    ],
  },
  {
    keywords: ['where', 'location', 'lahore', 'pakistan', 'australia', 'aus', 'based', 'city', 'country', 'remote'],
    phrases: ['where is he', 'where does he live'],
    lines: ['Based in Lahore, Pakistan — working the NOC role remotely for an Australian company.'],
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
    keywords: ['who', 'muzammil', 'muzamil', 'name', 'himself'],
    phrases: ['who is he', 'who are you', 'what does he do'],
    lines: [
      'Muhammad Muzamil — Quality Assurance, UI/UX Design, SEO, and Operations (AUS).',
      'He tests software, shapes interfaces, grows search visibility, and keeps operations running.',
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
