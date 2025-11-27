import { Hero, HowItWorks, CTA, Features } from "../components";

function Home() {
  return (
    <main className="grow">
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
    </main>
  );
}

export default Home;
