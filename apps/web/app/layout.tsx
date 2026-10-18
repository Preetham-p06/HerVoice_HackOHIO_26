import "./globals.css";
import { DiscreetSession } from "../components/DiscreetSession";
export const metadata = {
  title: "Everyday Notes — Ideas for everyday living",
  robots: { index: false, follow: false },
  description:
    "Thoughtful spaces, everyday rituals, and small ideas for ordinary days.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DiscreetSession>{children}</DiscreetSession>
      </body>
    </html>
  );
}
