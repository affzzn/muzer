import { Appbar } from "@/app/components/Appbar";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <Appbar />

      <section className="flex flex-col justify-center items-center text-center px-6 py-12 h-[calc(100vh-64px)] max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
          muzer
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl">
          The social music queue for pubs, parties, and shared spaces. Add
          songs, vote for your favorites — let the crowd decide what plays next.
        </p>

        <div className="mt-10 flex justify-center gap-4 flex-wrap">
          <Link
            href="/dashboard"
            className="bg-purple-600 hover:bg-purple-700 transition px-6 py-3 rounded-lg font-medium text-white"
          >
            Get Started
          </Link>
          <a
            href="#features"
            className="border border-gray-600 hover:border-purple-600 px-6 py-3 rounded-lg font-medium text-white transition"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Features section is visually hidden but can be accessed via "Learn More" */}
      <section
        id="features"
        className="absolute top-full left-0 w-full bg-gray-950 border-t border-gray-800 py-20 px-6"
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          <FeatureCard
            title="Crowd Voting"
            desc="Listeners upvote songs — the most popular plays next."
          />
          <FeatureCard
            title="YouTube & Spotify Support"
            desc="Add any song or video from YouTube or Spotify instantly."
          />
          <FeatureCard
            title="Perfect for Groups"
            desc="Built for pubs, parties, and shared spaces. No app needed."
          />
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-purple-600 transition">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{desc}</p>
    </div>
  );
}
