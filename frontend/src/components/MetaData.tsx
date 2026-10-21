/**
 * MetaData Component for SEO
 * In React 19, you can render <title>, <meta>, and <link> tags directly anywhere
 * in your component tree, and React will automatically hoist them to the document <head>.
 */
const MetaData = ({
  title,
  description,
  image,
  canonical,
  type = "website",
}: {
  title: string;
  description: string;
  image?: string;
  canonical: string;
  type?: string;
}) => {
  const BASE_URL =
    typeof window !== "undefined" ? window.location.origin : "";
  const defaultImage = `${BASE_URL}/og-default.png`;

  const siteTitle = title ? `${title} | LuckyStrike` : "LuckyStrike";
  const siteDescription =
    description ||
    "Play LuckyStrike draws, track tickets, and win cash prizes with trusted prize campaigns.";
  const imageUrl = image
    ? image.startsWith("http")
      ? image
      : `${BASE_URL}${image}`
    : defaultImage;

  return (
    <>
      <title>{siteTitle}</title>
      <meta name="description" content={siteDescription} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={siteDescription} />
      <meta property="og:image" content={imageUrl} />
      {canonical && (
        <meta property="og:url" content={`${BASE_URL}${canonical}`} />
      )}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={siteDescription} />
      <meta name="twitter:image" content={imageUrl} />

      {canonical && (
        <link rel="canonical" href={`${BASE_URL}${canonical}`} />
      )}
    </>
  );
};

export default MetaData;
