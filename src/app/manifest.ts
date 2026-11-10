import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dhaap — Lifelong Learning Engine",
    short_name: "Dhaap",
    description:
      "A lifelong learning roadmap and daily interview-style AI quiz system for senior software engineers.",
    start_url: "/today",
    display: "standalone",
    background_color: "#fbf7f0",
    theme_color: "#c2410c",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
