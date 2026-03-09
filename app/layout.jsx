export const metadata = {
  title: "HuntFit — Curated Style",
  description: "AI-powered fashion discovery",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } html, body { height: 100%; overflow: hidden; }`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
