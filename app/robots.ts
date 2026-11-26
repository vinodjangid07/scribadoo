import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/privacy", "/terms"],
        disallow: [
          "/dashboard",
          "/batches",
          "/attendance",
          "/students",
          "/fees",
          "/auth/",
        ],
      },
    ],
    sitemap: "https://scribadoo.vinodjangid.site/sitemap.xml",
  };
}
