/**
 * All portfolio content lives here.
 * Edit this file to update the site; components never hold copy.
 */

export type Link = { label: string; href: string };

export type Project = {
  title: string;
  description: string;
  stack: string[];
  year: string;
  repo?: string;
  demo?: string;
  /** Featured projects span the full width of the grid. */
  featured?: boolean;
};

export type SkillGroup = { label: string; items: string[] };

export type Job = {
  role: string;
  company: string;
  period: string;
  points: string[];
  stack?: string[];
};

export type Degree = {
  degree: string;
  school: string;
  period: string;
  note?: string;
};

export type Certificate = {
  name: string;
  issuer: string;
  year: string;
  href?: string;
};



/** Order controls the header navigation. */
export const profile = {
  name: "Haerunnas",
  role: "Software Developer",

  status: "open to opportunities",

  tagline:
    "I build software, explore security, and integrate AI into practical solutions.",

  summary:
    "I'm a Computer Science student interested in software engineering, cybersecurity, and AI integration. I enjoy designing and building software systems, exploring security concepts, and experimenting with AI/LLM technologies to solve practical problems. I value clean architecture, maintainable code, and continuous technical exploration.",

  email: "your-email@example.com",

  resumeHref: undefined as string | undefined,

  links: [
    { label: "github", href: "https://github.com/hrnnsx" },
    { label: "linkedin", href: "https://linkedin.com/in/your-username" },
  ] satisfies Link[],

  facts: [
    { label: "currently", value: "Computer Science Student" },
    {
      label: "focus",
      value: "Software Engineering & Cybersecurity",
    },
    {
      label: "exploring",
      value: "AI, LLM Integration & Application Security",
    },
  ],
};

/** Order controls the header navigation. */
export const navigation: Link[] = [
  { label: "projects", href: "#projects" },
  { label: "experience", href: "#experience" },
  { label: "skills", href: "#skills" },
  { label: "education", href: "#education" },
  { label: "certifications", href: "#certifications" },
];

/** Section headings and introductions. */
export const sections = {
  projects: {
    title: "projects",
    intro: "Software I've built and technical problems I've explored.",
  },
  experience: {
    title: "experience",
    intro: "My professional, organizational, and leadership experience.",
  },
  skills: {
    title: "skills",
    intro: "Technologies, tools, and technical areas I work with.",
  },
  education: {
    title: "education",
    intro: "My academic background and learning journey.",
  },
  certifications: {
    title: "certifications",
    intro: "Credentials and certifications I've earned.",
  },
};

export const projects: Project[] = [
  {
    title: "BiteShare",
    description:
      "A food donation management and e-commerce platform built around separate Donation and E-Commerce REST APIs. Features donation submissions, administrative reviews, pickup scheduling, and product inventory management, backed by a shared PostgreSQL database.",
    stack: [
      "Go",
      "Gin",
      "PostgreSQL",
      "Supabase",
      "Docker",
      "Swagger",
    ],
    year: "2026",
    repo: "https://github.com/hrnnsx/biteshare-api",
    featured: true,
  },
  {
    title: "PABI",
    description:
      "A Natural Language Interface to Databases (NLIDB) that translates natural language instructions into database operations. Uses a local LLM through Ollama, with a custom BLINC intermediate language, Lexer, Parser, AST, schema injection, and execution through the Supabase SDK.",
    stack: [
      "TypeScript",
      "Node.js",
      "Ollama",
      "Llama 3.1 8B",
      "Supabase",
    ],
    year: "2026",
    repo: "https://github.com/haerunnas/nlidb",
    featured: true,
  },
  {
    title: "Libra",
    description:
      "An anime discovery and personal library application built with Go and Gin. Provides anime discovery, personal collections, watch progress tracking, and image-based scene identification through external API integrations.",
    stack: [
      "Go",
      "Gin",
      "PostgreSQL",
      "GORM",
      "JWT",
      "Swagger",
      "AniList GraphQL",
      "trace.moe",
    ],
    year: "2026",
    demo: "https://libra-production-e912.up.railway.app",
    featured: true,
  },
];

export const experience: Job[] = [
  {
    role: "Head of Cybersecurity",
    company: "Google Developer Groups UIN Jakarta",
    period: "Nov 2025 - Sep 2026",
    points: [
      "Led cybersecurity-related initiatives, events, and educational activities.",
      "Organized technical learning activities to introduce cybersecurity concepts and practices to the developer community.",
    ],
    stack: [
      "Cybersecurity",
      "Technical Education",
      "Team Leadership",
    ],
  },
];

export const skills: SkillGroup[] = [
  {
    label: "languages",
    items: [
      "Go",
      "JavaScript",
      "TypeScript",
      "Python",
      "SQL",
    ],
  },
  {
    label: "backend & frameworks",
    items: [
      "Gin",
      "Express.js",
      "Node.js",
      "REST API",
    ],
  },
  {
    label: "databases",
    items: [
      "PostgreSQL",
      "MySQL",
      "MongoDB",
      "Supabase",
    ],
  },
  {
    label: "tools & infrastructure",
    items: [
      "Docker",
      "Swagger / OpenAPI",
      "Git",
      "Linux",
    ],
  },
  {
    label: "areas of interest",
    items: [
      "Software Engineering",
      "Cybersecurity",
      "Cryptography",
      "Data Protection",
      "AI & LLM Integration",
    ],
  },
];

export const education: Degree[] = [
  {
    degree: "Computer Science",
    school: "UIN Syarif Hidayatullah Jakarta",
    period: "In Progress",
    note: "Undergraduate studies in Computer Science.",
  },
];

export const certifications: Certificate[] = [];
