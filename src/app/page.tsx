import { Hero } from "@/components/sections/Hero";
import { Manifesto } from "@/components/sections/Manifesto";
import { Ecosystem } from "@/components/sections/Ecosystem";
import { About } from "@/components/sections/About";
import { Engineering } from "@/components/sections/Engineering";
import { GitHubSection } from "@/components/sections/GitHubSection";
import { Services } from "@/components/sections/Services";
import { JournalPreview } from "@/components/sections/JournalPreview";
import { Contact } from "@/components/sections/Contact";

export const revalidate = 3600;

export default function HomePage() {
  return (
    <>
      <Hero />
      <Manifesto />
      <Ecosystem />
      <About />
      <Engineering />
      <GitHubSection />
      <Services />
      <JournalPreview />
      <Contact />
    </>
  );
}
