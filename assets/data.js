// ─────────────────────────────────────────────────────────────
//  Edit this file to update the portfolio.
//  Everything on the page (room, project cards, project pages,
//  terminal, command palette) is generated from the data below.
// ─────────────────────────────────────────────────────────────

window.PORTFOLIO = {
  name: "Diego Ramirez",
  handle: "diego",
  role: "Urban Planning Student · UC DAAP",
  // Hero headline: the first line types out each of these words in turn,
  // followed by the fixed `headline` text.
  rotatingWords: ["Pathways", "Streets", "Campuses", "Intersections", "Communities"],
  headline: "designed for everyone.",
  intro:
    "I'm an urban planning student at the University of Cincinnati focused on accessibility, " +
    "universal design and walkable places. Every glowing object in this studio is a project. " +
    "Hover to explore, click to open.",
  // Short facts shown under the room (all from the résumé).
  stats: [
    { value: "14 acres", label: "Union Park plan over I-75" },
    { value: "310 sq ft", label: "ADA tiny house designed" },
    { value: "15+", label: "universal design features" },
    { value: "1 of 16", label: "MDA scholars (350+ applicants)" },
    { value: "10K+", label: "BLINK installation viewers" },
  ],
  location: "Cincinnati, OH",
  about:
    "I'm pursuing a Bachelor of Urban Planning at the University of Cincinnati's College of Design, " +
    "Architecture, Art, and Planning (DAAP), expected May 2029. My work looks at the gap between places " +
    "that are merely compliant and places that are truly inclusive, using mapping, sketching and 3D " +
    "modeling to show how people actually move through a city. I'm fluent in Spanish and have advocated " +
    "with U.S. legislators for accessible infrastructure and inclusive community development.",
  skills: ["SketchUp", "AutoCAD", "ArcGIS", "Illustrator", "InDesign", "Photoshop", "ADA compliance", "Universal design", "Accessible wayfinding", "Spanish (fluent)"],
  education: {
    school: "University of Cincinnati · DAAP",
    degree: "Bachelor of Urban Planning",
    date: "Expected May 2029",
    honors: [
      "JB's Keys to DMD Educational Scholarship: sole national recipient",
      "MDA College Scholarship: 1 of 16 selected from 350+ applicants",
    ],
  },
  experience: [
    { org: "Magdalena Homes", role: "Accessible Housing Design Intern", date: "Jan – Apr 2026", place: "San Francisco, CA (hybrid)" },
    { org: "Total Home Care Services", role: "Operations & Team Manager", date: "Aug 2022 – Present", place: "Cincinnati, OH" },
    { org: "Parent Project Muscular Dystrophy", role: "Policy Advocate", date: "Jun 2021 – Mar 2024", place: "Cincinnati, OH" },
    { org: "NS Pharma", role: "Patient Advocate", date: "Apr 2023 – Apr 2024", place: "Cincinnati, OH" },
    { org: "Brothers Keepers", role: "Co-Founder", date: "2022", place: "Cincinnati, OH" },
  ],

  links: {
    email: "mailto:ramiredo@mail.uc.edu",
    linkedin: "https://www.linkedin.com/in/diegoramirez04",
    github: "",
    resume: "",            // e.g. "assets/resume.pdf"
  },

  // Each project becomes a glowing object in the room, a card, a full
  // project view, and a terminal entry.
  //   room     → object(s) in the room, one slot or a list: "model" (3D campus table)
  //              | "pad" (tracing pad on the desk) | "map" (wall map) | "monitor"
  //              | "house" (shelf) | "blink" (light sculpture)
  //              (also available: "board" | "blueprints" | "tree")
  //   viewer3d → true shows the interactive 3D figure-ground model in the project view
  //   hover    → optional text for the room's hover label (defaults to the summary)
  //   cover   → image shown on the card and at the top of the project view
  //   gallery → [{ src, caption, group }]; click an image to enlarge it
  projects: [
    {
      id: "campus-mapping",
      num: "01",
      title: "Campus Analysis Mapping",
      room: "model",
      viewer3d: true,
      hover: "University of Cincinnati’s Campus – Figure Ground",
      context: "UC DAAP coursework",
      status: "live",
      summary: "Figure-ground maps of UC's building footprints and pathways, by hand and in AutoCAD and ArcGIS.",
      description: [
        "A series of maps highlighting building footprints and pathways at the University of Cincinnati. The work was completed to develop my understanding of figure-ground mapping while gaining experience with ArcGIS, AutoCAD, and hand-drawing techniques.",
        "Two hand-drawn maps explore the relationship between pedestrian movement and the physical form of the campus. Two AutoCAD maps follow: a white-on-black design highlighting the campus's walkable pathways, and a black-on-white design emphasizing building footprints.",
      ],
      tags: ["mapping", "gis"],
      stack: ["ArcGIS", "AutoCAD", "Hand drawing"],
      color: "#7fbf3f",
      cover: "assets/img/campus-color.jpg",
      gallery: [
        { src: "assets/img/campus-hand-footprint.jpg", caption: "Hand-drawn building footprint map", group: "Hand drawn" },
        { src: "assets/img/campus-hand-pathway.jpg", caption: "Hand-drawn pathway map", group: "Hand drawn" },
        { src: "assets/img/campus-cad-white-on-black.jpg", caption: "AutoCAD white-on-black map: walkable pathways", group: "AutoCAD" },
        { src: "assets/img/campus-cad-black-on-white.jpg", caption: "AutoCAD black-on-white map: building footprints", group: "AutoCAD" },
      ],
      links: {},
    },
    {
      id: "inclusive-vs-compliant",
      num: "02",
      title: "Inclusive vs. Compliant Pathways",
      room: "map",
      context: "UC DAAP coursework",
      status: "live",
      summary: "Where UC's wheelchair-accessible routes split from the paths most students actually use.",
      description: [
        "This project highlights the design of wheelchair-accessible pathways at the University of Cincinnati. While many pathways meet accessibility requirements, they are often separated from the routes most commonly used by students. The project examines the relationship between accessibility and pedestrian movement, emphasizing the importance of integrating accessible pathways into the primary circulation network.",
        "Using Adobe Illustrator and ArcGIS, I mapped the pathway network through the lens of wheelchair accessibility, with color gradients showing strong, moderate and poor integration. Perspective sketches and SketchUp models compare the ramp at Lindner Hall, which shares the main entrance route, with Langsam Library's zig-zag ramp and the Clifton Court Hall ramp that ends before reaching ground level.",
      ],
      tags: ["accessibility", "gis", "design"],
      stack: ["ArcGIS", "Illustrator", "SketchUp", "Hand sketching"],
      color: "#2bb673",
      cover: "assets/img/inclusive-map-clean.jpg",
      gallery: [
        { src: "assets/img/inclusive-map.jpg", caption: "Pathway integration map: green = strong, yellow = moderate, red = poor integration", group: "Integration map" },
        { src: "assets/img/inclusive-sketch-linder.jpg", caption: "Sketch: ramp to Lindner Hall (well integrated)", group: "Sketches" },
        { src: "assets/img/inclusive-sketch-clifton.jpg", caption: "Sketch: stairway to Clifton Court Hall", group: "Sketches" },
        { src: "assets/img/inclusive-sketch-langsam.jpg", caption: "Sketch: ramp & stairway to Langsam Library", group: "Sketches" },
        { src: "assets/img/inclusive-3d-linder.jpg", caption: "3D view: Lindner main entrance ramp", group: "3D views" },
        { src: "assets/img/inclusive-3d-clifton-a.jpg", caption: "3D view: Clifton Court Hall stairway, view A", group: "3D views" },
        { src: "assets/img/inclusive-3d-clifton-b.jpg", caption: "3D view: Clifton Court Hall stairway, view B", group: "3D views" },
      ],
      links: {},
    },
    {
      id: "hopkins-dalton",
      num: "03",
      title: "Hopkins St & Dalton Ave Redevelopment",
      room: "monitor",
      context: "UC DAAP coursework",
      status: "live",
      summary: "Reimagining the car-centric intersection at Union Terminal's entrance as a walkable place.",
      description: [
        "This project reimagines the intersection at the entrance to Union Terminal, designed in SketchUp to prioritize walkability and foster a stronger sense of community.",
        "Street views of the existing site (an abandoned warehouse, a gated opening in the wall and a car-centric intersection) are paired with SketchUp renderings of the redevelopment: a four-way intersection with a pedestrian-friendly environment, ground-floor shops and a new pathway with a ramp and stairway through the wall.",
      ],
      tags: ["design", "walkability"],
      stack: ["SketchUp", "Google Street View"],
      color: "#f2a33a",
      cover: "assets/img/hopkins-after-intersection.jpg",
      gallery: [
        { src: "assets/img/hopkins-before-aerial.jpg", caption: "Before: aerial view prior to redevelopment", group: "Before → after" },
        { src: "assets/img/hopkins-after-aerial.jpg", caption: "After: bird's-eye view of the full redevelopment", group: "Before → after" },
        { src: "assets/img/hopkins-before-intersection.jpg", caption: "Before: car-centric intersection", group: "Before → after" },
        { src: "assets/img/hopkins-after-intersection.jpg", caption: "After: four-way intersection with a pedestrian-friendly environment", group: "Before → after" },
        { src: "assets/img/hopkins-before-warehouse.jpg", caption: "Before: abandoned warehouse", group: "Site & new connections" },
        { src: "assets/img/hopkins-after-coffee.jpg", caption: "After: coffee shop and storefronts", group: "Site & new connections" },
        { src: "assets/img/hopkins-before-gate.jpg", caption: "Before: gated opening", group: "Site & new connections" },
        { src: "assets/img/hopkins-after-ramp-entrance.jpg", caption: "After: pathway ramp and stairway entrance", group: "Site & new connections" },
        { src: "assets/img/hopkins-after-ramp-exit.jpg", caption: "After: pathway ramp and stairway exit", group: "Site & new connections" },
      ],
      links: {},
    },
    {
      id: "union-park",
      num: "04",
      title: "Union Park",
      room: "board",
      context: "UC DAAP coursework",
      status: "live",
      summary: "Queensgate’s first public park, capping I-75 beside Union Terminal to improve the pedestrian environment.",
      description: [
        "Union Park is a 14-acre public park for Queensgate, built over I-75 next to Cincinnati Union Terminal. The goal is to reconnect the neighborhood and improve the pedestrian environment between Ezzard Charles Dr, Western Ave, Gest St and Freeman Ave.",
        "The park plan includes food trucks, a carousel and fountains, a skate park, an ice cream shop and an amphitheater for pop concerts, along with a playground, picnic tables, swings and a yoga area.",
        "New development around the park adds three apartment buildings with 161 units, three attached parking garages and 14,000 sq ft of commercial space, including the Union Park Apartments & Garage and Queensgate Market.",
      ],
      tags: ["design", "parks"],
      stack: ["Site planning", "3D renders", "Mixed-use development"],
      color: "#3f78b5",
      cover: "assets/img/union-park-site-plan.jpg",
      gallery: [
        { src: "assets/img/union-park-plan-slide.jpg", caption: "Union Park Plan: metrics, site plan and park features", group: "Park plan" },
        { src: "assets/img/union-park-site-plan.jpg", caption: "Site plan between Union Terminal and The Arts at Music Hall Apartments", group: "Park plan" },
        { src: "assets/img/union-park-food-trucks.jpg", caption: "Food trucks plaza", group: "Park features" },
        { src: "assets/img/union-park-carousel.jpg", caption: "Carousel & fountains", group: "Park features" },
        { src: "assets/img/union-park-skate-park.jpg", caption: "Skate park", group: "Park features" },
        { src: "assets/img/union-park-ice-cream.jpg", caption: "Ice cream shop and picnic area", group: "Park features" },
        { src: "assets/img/union-park-amphitheater.jpg", caption: "Amphitheater", group: "Park features" },
        { src: "assets/img/union-park-developments-slide.jpg", caption: "New developments: 3 apartment buildings, 161 units, 3 parking garages, 14,000 sq ft of commercial space", group: "New developments" },
      ],
      links: {},
    },
    {
      id: "magdalena-tiny-house",
      num: "05",
      title: "ADA Tiny House · Magdalena Homes",
      room: "house",
      context: "Internship · Jan – Apr 2026",
      status: "live",
      summary: "Magdalena Homes' first ADA-compliant tiny house, designed from scratch in 12 weeks.",
      description: [
        "As an Accessible Housing Design Intern, I independently designed Magdalena Homes' first ADA-compliant tiny house from scratch in AutoCAD and SketchUp.",
        "Over 12 weeks I incorporated 15+ universal design features into the spatial layout and accessibility of a 310 sq ft footprint. I also managed regulatory compliance and documentation for 5 homes imported from Colombia, coordinating across the DMV, customs brokers and logistics companies to process 40+ documents.",
      ],
      tags: ["accessibility", "housing", "design"],
      stack: ["AutoCAD", "SketchUp", "ADA compliance"],
      color: "#5b8def",
      links: {},
    },
    {
      id: "blink-future-city",
      num: "06",
      title: "BLINK Festival: \"Future City\"",
      room: "blink",
      context: "Student designer · Oct 2024",
      status: "live",
      summary: "An illuminated, leaf-shaped wearable sculpture about urban sustainability for BLINK, Cincinnati's light and art festival.",
      description: [
        "For BLINK, the nation's largest light and art festival, I designed an illuminated, leaf-shaped wearable sculpture featuring urban sustainability.",
        "The leaf is built from overlapping translucent panels in autumn reds, oranges, yellows and greens, wrapped in LED string lights. I engineered and prototyped 15+ pieces from recycled cardboard and LED lighting within a one-week build. The work was featured on the BLINK website, in the Cincinnati Enquirer and on UC DAAP social media, reaching 10K+ viewers.",
      ],
      tags: ["installation", "sustainability"],
      stack: ["Recycled cardboard", "LED lighting", "Prototyping"],
      color: "#e8742c",
      cover: "assets/img/blink-leaf-detail.jpg",
      gallery: [
        { src: "assets/img/blink-leaf-detail.jpg", caption: "The illuminated leaf: overlapping translucent panels and LED string lights", group: "The piece" },
      ],
      links: {},
    },
  ],
};
