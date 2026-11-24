import { getPublicProfile } from "@/lib/data/profile";

const fallbackName = "Aye Chan Pyae Thu";
const fallbackHeadline =
  "I'm a passionate developer with a love for creating innovative solutions.";

const fallbackBiography = `I'm a final-year Information Technology student at Technological University (Mandalay), with a growing interest in Artificial Intelligence, Data Analysis, and Software Development.

I'm curious about how technology can solve real-world problems and enjoy exploring new ideas, learning through experience, and strengthening my problem-solving skills.

As a hardworking and reflective learner, I believe in continuous improvement. I'm excited to gain practical experience, discover where my interests lead, and grow into a capable technology professional.`;

type ProfileIntroProps = {
  variant?: "home" | "about";
};

export function ProfileIntroFallback({
  variant = "home",
}: ProfileIntroProps) {
  return (
    <>
      <span
        className="text-2xl sm:text-3xl lg:text-4xl
  font-bold mb-3 text-blue-500 leading-tight"
      >
        {fallbackName}
      </span>

      <p
        className="text-sm sm:text-base lg:text-lg
  mb-5 max-w-xl leading-relaxed whitespace-pre-line"
      >
        {variant === "about" ? fallbackBiography : fallbackHeadline}
      </p>
    </>
  );
}

export default async function ProfileIntro({
  variant = "home",
}: ProfileIntroProps) {
  const profile = await getPublicProfile();

  if (!profile) {
    return <ProfileIntroFallback variant={variant} />;
  }

  const description =
    variant === "about"
      ? profile.biography || fallbackBiography
      : profile.headline || fallbackHeadline;

  return (
    <>
      <span
        className="text-2xl sm:text-3xl lg:text-4xl
  font-bold mb-3 text-blue-500 leading-tight"
      >
        {profile.display_name || fallbackName}
      </span>

      <p
        className="text-sm sm:text-base lg:text-lg
  mb-5 max-w-xl leading-relaxed whitespace-pre-line"
      >
        {description}
      </p>
    </>
  );
}
