import { Metadata } from "next";

// Keyword Categories
const PRIMARY_KEYWORDS = [
  "indoor trampoline park",
  "kids activity park",
  "family entertainment center",
  "indoor play area",
  "kids play zone",
  "indoor playground",
  "indoor fun park",
  "indoor adventure park",
  "indoor amusement park",
  "soft play area",
  "kids fun zone",
  "safe indoor play area",
  "indoor activities for kids",
  "weekend activities for kids",
  "fun activities for kids",
  "family activities",
  "kids activity center",
  "adventure park for children",
  "indoor play center",
  "kids indoor games",
  "rainy day activities for kids"
];

const BOOKING_KEYWORDS = [
  "birthday party venue",
  "kids birthday party venue",
  "kids birthday party booking",
  "birthday party places for kids",
  "indoor birthday party venue",
  "kids party hall",
  "party booking venue",
  "birthday party packages for kids",
  "indoor party hall for kids",
  "kids birthday celebration place",
  "book kids activities",
  "kids play area booking",
  "trampoline park bookings",
  "group booking kids play area",
  "kids event venue",
  "family party venue"
];

const BRAND_KEYWORDS = [
  "ninja inflatable park",
  "ninja park",
  "kids adventure zone",
  "kids play and fun park",
  "family fun park",
  "indoor kids entertainment",
  "kids fun activities",
  "child friendly play area",
  "kids recreation center"
];

const BANGALORE_KEYWORDS = [
  "indoor play area in Bangalore",
  "kids activity park in Bangalore",
  "indoor trampoline park Bangalore",
  "kids play zone in Bangalore",
  "indoor playground Bangalore",
  "family entertainment center Bangalore",
  "kids birthday party venue in Bangalore",
  "birthday party places for kids in Bangalore",
  "indoor birthday party venue Bangalore",
  "kids party hall in Bangalore",
  "weekend activities for kids in Bangalore",
  "indoor activities for kids Bangalore",
  "fun places for kids in Bangalore"
];

export const SEO_KEYWORDS = [
  ...PRIMARY_KEYWORDS,
  ...BOOKING_KEYWORDS,
  ...BRAND_KEYWORDS,
  ...BANGALORE_KEYWORDS
];

export const SEO_CONFIG = {
  siteName: "Ninja Inflatable Park",
  title: "Ninja Inflatable Park | India's Biggest Inflatable Park in Bangalore",
  description: "Experience the ultimate fun at Ninja Inflatable Park, India's biggest inflatable park in Bangalore! Perfect for kids' birthday parties, family entertainment, weekend activities, and adventure. Book your slot now!",
  baseUrl: "https://ninjapark-frontend.azurewebsites.net",
  keywords: SEO_KEYWORDS,
  openGraph: {
    type: "website",
    locale: "en_IE",
    url: "https://ninjapark-frontend.azurewebsites.net/",
    siteName: "Ninja Inflatable Park",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Ninja Inflatable Park",
      },
    ],
  },
};

export function getMetadata(
  title?: string,
  description?: string,
  icons?: Metadata['icons']
): Metadata {
  const metaTitle = title
    ? `${title} | ${SEO_CONFIG.siteName}`
    : SEO_CONFIG.title;

  const metaDescription = description || SEO_CONFIG.description;

  return {
    metadataBase: new URL(SEO_CONFIG.baseUrl),
    title: metaTitle,
    description: metaDescription,
    keywords: SEO_CONFIG.keywords,
    openGraph: {
      ...SEO_CONFIG.openGraph,
      title: metaTitle,
      description: metaDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: SEO_CONFIG.openGraph.images,
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: icons || {
      icon: '/favicon.png',
    },
  };
}
