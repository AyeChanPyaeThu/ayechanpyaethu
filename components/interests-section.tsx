import {
  BookOpenText,
  Lightbulb,
  PencilSparkles,
  SearchCode,
  Sparkles,
  TvMinimalPlay,
  UserRoundGroup,
} from "lucide-react";
import Why from "@/components/why";
import { getPublicInterests } from "@/lib/data/interests";

const interestIcons = {
  SearchCode,
  BookOpenText,
  UserRoundGroup,
  Lightbulb,
  PencilSparkles,
  TvMinimalPlay,
};

function InterestIcon({ icon }: { icon: string | null }) {
  const Icon =
    icon && icon in interestIcons
      ? interestIcons[icon as keyof typeof interestIcons]
      : Sparkles;

  return <Icon size={38} strokeWidth={1.5} />;
}

export default async function InterestsSection() {
  const interests = await getPublicInterests();

  return (
    <section
      className="flex flex-col items-center justify-center mt-10 w-full text-black"
      id="interests"
    >
      <h1 className="mb-5 text-center text-2xl sm:text-3xl lg:text-4xl">
        My interests
      </h1>

      <nav
        className="menu neumorphic-two grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 w-full py-6 px-6 sm:px-6 md:px-10"
        aria-label="My interests"
      >
        {interests.map((interest) => (
          <div
            key={interest.id}
            className="menu-card w-full min-w-0 p-4 sm:p-5 rounded-2xl"
          >
            <p className="flex items-center gap-2 text-lg sm:text-xl lg:text-2xl text-black">
              <InterestIcon icon={interest.icon} />
              {interest.name}
            </p>
            <Why interest={interest} />
          </div>
        ))}
      </nav>
    </section>
  );
}

export function InterestsSectionFallback() {
  return (
    <section
      className="flex flex-col items-center justify-center mt-10 w-full text-black"
      id="interests"
    >
      <h1 className="mb-5 text-center text-2xl sm:text-3xl lg:text-4xl">
        My interests
      </h1>
      <div className="min-h-32 w-full" />
    </section>
  );
}
