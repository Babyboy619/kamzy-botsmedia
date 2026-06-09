export const SITE = {
  name: "KAMZYBOT'S MEDIA",
  tagline: "Premium Social Media Logs & Digital Services",
  shortName: "KAMZYBOTS",
  logoLetter: "K",
  email: "kamzybotsmedia@gmail.com",
  emailHref: "mailto:kamzybotsmedia@gmail.com",
  phone: "+234 815 969 6814",
  phoneRaw: "+2348159696814",
  whatsappMessage: "https://wa.me/2348159696814",
  whatsappGroup: "https://chat.whatsapp.com/EvXxgtIsxPiDsEGFQcMP9v",
  telegramChannel: "https://t.me/kamzybotsmedia01",
  telegramContact: "https://t.me/Kamzybotsmedia",
  address: "023 Old Poly Quarters, Lokoja, Kogi State, Nigeria",
};

export const CONTACTS = {
  whatsappMessage: SITE.whatsappMessage,
  whatsappCommunity: SITE.whatsappGroup,
  telegramChannel: SITE.telegramChannel,
  telegramContact: SITE.telegramContact,
  email: SITE.email,
  emailHref: SITE.emailHref,
  address: SITE.address,
};

export const ADMIN_OWNER_EMAIL = "kamzybotsmedia@gmail.com";

export const platforms = [
  { name: "Facebook", slug: "facebook" },
  { name: "Instagram", slug: "instagram" },
  { name: "Gmail", slug: "gmail" },
  { name: "TikTok", slug: "tiktok" },
  { name: "VPN", slug: "vpn" },
  { name: "Reddit", slug: "reddit" },
  { name: "Twitter / X", slug: "twitter-x" },
  { name: "LinkedIn", slug: "linkedin" },
  { name: "Firstmail", slug: "firstmail" },
  { name: "Yahoo Mail", slug: "yahoo-mail" },
  { name: "Gift Card", slug: "gift-card" },
];

export const navLinks = [
  { name: "Home", to: "/" as const },
  { name: "About", to: "/about" as const },
  { name: "Products", to: "/products" as const },
  { name: "Contact", to: "/contact" as const },
];
