import { getPublicProfile } from "@/lib/data/profile";

const fallbackName = "Aye Chan Pyae Thu";
const fallbackHeadline =
  "I'm a passionate developer with a love for creating innovative solutions.";

export function ProfileIntroFallback() {
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
  mb-5 max-w-xl leading-relaxed"
      >
        {fallbackHeadline}
      </p>
    </>
  );
}

export default async function ProfileIntro() {
  const profile = await getPublicProfile();

  if (!profile) {
    return <ProfileIntroFallback />;
  }

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
  mb-5 max-w-xl leading-relaxed"
      >
        {profile.headline || fallbackHeadline}
      </p>
    </>
  );
}
