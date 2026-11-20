
import type { ApplicationRegistry } from "./types";

// BiteShare
import BiteShareOverview from "./projects/biteshare/Overview";
import BiteSharePreview from "./projects/biteshare/Preview";
import BiteShareTechnical from "./projects/biteshare/Technical";

// PABI
// import PABIOverview from "./projects/pabi/Overview";
// import PABITechnical from "./projects/pabi/Technical";


// ** helper
export function getApplication(id: string) {
  return applications[id.toLowerCase()] ?? null;
}

export function getAllApplications() {
  return Object.values(applications);
}

export const applications: ApplicationRegistry = {
  biteshare: {
    id: "biteshare",
    name: "BiteShare",
    description: "Food donation and e-commerce platform",
    icon: "applications/biteshare",
    views: [
      {
        id: "overview",
        name: "Overview",
        component: BiteShareOverview,
      },
      {
        id: "preview",
        name: "Preview",
        component: BiteSharePreview,
      },
      {
        id: "technical",
        name: "Technical",
        component: BiteShareTechnical,
      },
    ],
  },

  // pabi: {
  //   id: "pabi",
  //   name: "PABI",
  //   description: "Natural language interface for databases",
  //   icon: "applications/pabi",
  //   views: [
  //     {
  //       id: "overview",
  //       name: "Overview",
  //       component: PABIOverview,
  //     },
  //     {
  //       id: "technical",
  //       name: "Technical",
  //       component: PABITechnical,
  //     },
  //   ],
  // },
};
