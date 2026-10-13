// ─────────────────────────────────────────────────────────────
//  Edit this file to make the portfolio yours.
//  Everything on the page (room, project cards, terminal,
//  command palette) is generated from the data below.
// ─────────────────────────────────────────────────────────────

window.PORTFOLIO = {
  name: "Diego Ramirez Laverde",
  handle: "diego",
  role: "Urban Planner",
  // Hero headline: the first line types out each of these words in turn,
  // followed by the fixed `headline` text.
  rotatingWords: ["Streets", "Neighborhoods", "Transit", "Parks", "Cities"],
  headline: "designed for people.",
  intro:
    "I'm an urban planner working at the intersection of land use, mobility and community. " +
    "Every object in this studio is a project. Hover to explore, click to open.",
  // Short stats shown under the room. Keep these honest.
  stats: [
    { value: "5", label: "featured projects" },
    { value: "GIS", label: "spatial analysis" },
    { value: "100%", label: "people-first" },
    { value: "∞", label: "walkable blocks to fix" },
  ],
  location: "Somewhere walkable",
  about:
    "I care about cities that work for the people who live in them: safe streets, good transit, " +
    "parks within a short walk and housing people can afford. I combine spatial analysis, design " +
    "and community engagement to turn plans into places.",
  skills: ["ArcGIS Pro", "QGIS", "AutoCAD", "SketchUp", "Adobe Illustrator", "Python", "Zoning & land use", "Community engagement"],

  links: {
    email: "mailto:diegoramirezlaverde04@gmail.com",
    github: "https://github.com/diegoramirezlaverde04-pixel",
    linkedin: "",          // e.g. "https://www.linkedin.com/in/your-name"
    resume: "",            // e.g. "assets/resume.pdf"
  },

  // Each project becomes a glowing object in the room, a card, a modal,
  // and a terminal entry.
  //   room   → which object in the room represents it (optional):
  //            "model" | "map" | "gis" | "board" | "blueprints" | "tree" | "transit"
  //            Projects without one fill the remaining objects in order.
  //   tags   → used by the filter chips
  //   color  → accent color (any hex color)
  //   status → "live" | "wip" | "archived"
  projects: [
    {
      id: "downtown-model",
      title: "Downtown Infill Plan",
      room: "model",
      year: 2026,
      status: "live",
      summary: "Massing study for mixed-use infill around a future transit hub.",
      description:
        "Describe the site, the goals (housing units, jobs, public space), the alternatives you tested " +
        "and what the final concept proposed. Add renders or a link to the full plan.",
      tags: ["land use", "design"],
      stack: ["SketchUp", "AutoCAD", "Illustrator"],
      color: "#ff7d41",
      links: { live: "", code: "" },
    },
    {
      id: "zoning-explorer",
      title: "Zoning Map Explorer",
      room: "map",
      year: 2026,
      status: "live",
      summary: "An interactive map that explains what can be built on every parcel.",
      description:
        "What question did the map answer? Which datasets did you join? Who used it and what did they learn?",
      tags: ["gis", "land use"],
      stack: ["ArcGIS Pro", "ArcGIS Online"],
      color: "#7c5cff",
      links: { live: "", code: "" },
    },
    {
      id: "park-access",
      title: "Park Access Analysis",
      room: "gis",
      year: 2025,
      status: "live",
      summary: "Network analysis of which neighborhoods lack a park within a 10-minute walk.",
      description:
        "Explain the method (network buffers, demographic overlays), the key finding and the recommendation it led to.",
      tags: ["gis", "data"],
      stack: ["QGIS", "Python", "Census data"],
      color: "#50c878",
      links: { live: "", code: "" },
    },
    {
      id: "community-workshops",
      title: "Community Workshop Series",
      room: "board",
      year: 2025,
      status: "archived",
      summary: "Engagement program that gathered 300+ resident ideas for a corridor plan.",
      description:
        "How did you reach people who don't usually come to meetings? What tools did you use and how did the feedback shape the plan?",
      tags: ["engagement"],
      stack: ["Facilitation", "Survey design", "Miro"],
      color: "#f5c518",
      links: { live: "", code: "" },
    },
    {
      id: "complete-streets",
      title: "Complete Streets Redesign",
      room: "blueprints",
      year: 2024,
      status: "wip",
      summary: "Street section redesign adding protected bike lanes and wider sidewalks.",
      description:
        "Show before/after street sections, the safety data behind the redesign and how you balanced parking, transit and space for people walking and cycling.",
      tags: ["mobility", "design"],
      stack: ["Streetmix", "AutoCAD", "Crash data"],
      color: "#64b4ff",
      links: { live: "", code: "" },
    },
  ],
};
