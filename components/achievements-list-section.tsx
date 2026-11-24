import Link from "next/link";

import DetailsModal from "@/components/details-modal";
import { getPublicAchievements } from "@/lib/data/achievements";

export default async function AchievementsListSection() {
  const achievements = await getPublicAchievements();

  return (
    <>
      <div className="w-full mb-12">
        {achievements.length > 0 ? (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="min-w-0 neumorphic-two rounded-lg bg-white px-5 sm:px-6 lg:px-8 py-6 hover:-translate-y-2 transition duration-300"
              >
                {achievement.img ? (
                  <img
                    src={achievement.img}
                    alt={achievement.name}
                    className="h-44 sm:h-42 w-full object-cover rounded-3xl"
                  />
                ) : (
                  <div className="h-44 sm:h-42 w-full rounded-3xl bg-amber-50" />
                )}

                <h3 className="mt-3 text-lg sm:text-xl font-extrabold text-amber-900">
                  {achievement.name}
                </h3>

                <p className="text-sm sm:text-base text-gray-700">
                  {achievement.note}
                </p>

                <DetailsModal
                  project={achievement}
                  variant="certificate"
                  triggerClassName="mt-5 w-full py-2 rounded-3xl text-white bg-amber-800 hover:cursor-pointer hover:bg-amber-600 transition"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-gray-600">
            Achievements will be added soon.
          </p>
        )}
      </div>

      <Link
        href="/#achievements"
        className="neumorphic-two w-full max-w-xs sm:w-md btn-neu mb-12 text-3xl sm:text-4xl md:text-5xl text-black text-center"
      >
        Back
      </Link>
    </>
  );
}

export function AchievementsListSectionFallback() {
  return <div className="w-full min-h-64 mb-12" />;
}
