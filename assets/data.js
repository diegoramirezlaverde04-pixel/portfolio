// ─────────────────────────────────────────────────────────────
//  Edit this file to make the portfolio yours.
//  Everything on the page (hero, projects, terminal, command
//  palette) is generated from the data below.
// ─────────────────────────────────────────────────────────────

window.PORTFOLIO = {
  name: "Diego Ramirez Laverde",
  handle: "diego",
  role: "Developer & Builder",
  // Phrases cycled by the typewriter in the hero section.
  taglines: [
    "I build things for the web.",
    "I turn ideas into interactive products.",
    "I like clean code and fast feedback loops.",
  ],
  location: "Earth",
  about:
    "I'm a developer who enjoys building interactive, useful software. " +
    "This site is a playground for my projects. Poke around, open the terminal, or press Ctrl/⌘ + K.",
  skills: ["JavaScript", "TypeScript", "Python", "React", "Node.js", "HTML / CSS", "Git", "SQL"],

  links: {
    email: "mailto:diegoramirezlaverde04@gmail.com",
    github: "https://github.com/diegoramirezlaverde04-pixel",
    linkedin: "",          // e.g. "https://www.linkedin.com/in/your-name"
    resume: "",            // e.g. "assets/resume.pdf"
  },

  // Each project becomes a card, a modal, and a terminal entry.
  //   tags   → used by the filter chips
  //   color  → accent used on the card (any CSS color)
  //   status → "live" | "wip" | "archived"
  projects: [
    {
      id: "project-one",
      title: "Project One",
      year: 2026,
      status: "live",
      summary: "A short, punchy one-liner about what this project does.",
      description:
        "Describe the problem, what you built, and what you learned. " +
        "Mention anything you're proud of: performance wins, design choices, users, numbers.",
      tags: ["web", "javascript"],
      stack: ["HTML", "CSS", "JavaScript"],
      color: "#7c5cff",
      links: { live: "", code: "https://github.com/diegoramirezlaverde04-pixel" },
    },
    {
      id: "project-two",
      title: "Project Two",
      year: 2026,
      status: "wip",
      summary: "A data or automation project that saves people time.",
      description:
        "What data did you work with? What did the tool automate? " +
        "Screenshots or a demo link make this much stronger.",
      tags: ["python", "data"],
      stack: ["Python", "Pandas"],
      color: "#00d1b2",
      links: { live: "", code: "" },
    },
    {
      id: "project-three",
      title: "Project Three",
      year: 2025,
      status: "live",
      summary: "A full-stack app with accounts, an API and a database.",
      description:
        "Talk about the architecture, the hardest bug you fixed, and how you deployed it.",
      tags: ["web", "fullstack"],
      stack: ["React", "Node.js", "PostgreSQL"],
      color: "#ff6b6b",
      links: { live: "", code: "" },
    },
    {
      id: "project-four",
      title: "Project Four",
      year: 2025,
      status: "archived",
      summary: "A game, experiment or creative coding sketch.",
      description: "Playful projects show curiosity. Explain what inspired it and what you'd do next.",
      tags: ["creative", "javascript"],
      stack: ["Canvas", "JavaScript"],
      color: "#ffb84d",
      links: { live: "", code: "" },
    },
  ],
};
