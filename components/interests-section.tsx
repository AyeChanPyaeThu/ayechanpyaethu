import {
  Book,
  BookOpen,
  Camera,
  Code,
  Palette,
  Music,
  Plane,
  Dumbbell,
  Leaf,
  Gamepad2,
  Coffee,
  Globe,
  Brain,
  Film,
  Mountain,
  Utensils,
  Bike,
  Flower2,
  Headphones,
  Guitar,
  GraduationCap,
  Microscope,
  FlaskConical,
  Telescope,
  Map,
  CookingPot,
  Trophy,
  Puzzle,
  NotebookPen,
  Paintbrush,
  MonitorPlay,
  Smartphone,
  Laptop,
  Bot,
  Cpu,
  SearchCode,
  BookOpenText,
  UserRoundGroup,
  Lightbulb,
  PencilSparkles,
  TvMinimalPlay,
  Sparkles,
  Plus,
  Heart,
  Loader2,
  Search,
  PencilLine,
  Trash2,
  X,
  EyeOff,
  Eye,
  ArrowUpDown,
} from "lucide-react";
import Why from "@/components/why";
import { getPublicInterests } from "@/lib/data/interests";

const interestIcons = [
  { name: "SearchCode", Icon: SearchCode },
  { name: "BookOpenText", Icon: BookOpenText },
  { name: "UserRoundGroup", Icon: UserRoundGroup },
  { name: "Lightbulb", Icon: Lightbulb },
  { name: "PencilSparkles", Icon: PencilSparkles },
  { name: "TvMinimalPlay", Icon: TvMinimalPlay },
  { name: "Sparkles", Icon: Sparkles },

  { name: "Book", Icon: Book },
  { name: "BookOpen", Icon: BookOpen },
  { name: "Camera", Icon: Camera },
  { name: "Code", Icon: Code },
  { name: "Palette", Icon: Palette },
  { name: "Music", Icon: Music },
  { name: "Plane", Icon: Plane },
  { name: "Dumbbell", Icon: Dumbbell },
  { name: "Leaf", Icon: Leaf },
  { name: "Gamepad2", Icon: Gamepad2 },
  { name: "Coffee", Icon: Coffee },
  { name: "Globe", Icon: Globe },
  { name: "Brain", Icon: Brain },
  { name: "Film", Icon: Film },
  { name: "Mountain", Icon: Mountain },
  { name: "Utensils", Icon: Utensils },
  { name: "Bike", Icon: Bike },
  { name: "Flower2", Icon: Flower2 },

  { name: "Headphones", Icon: Headphones },
  { name: "Guitar", Icon: Guitar },
  { name: "GraduationCap", Icon: GraduationCap },
  { name: "Microscope", Icon: Microscope },
  { name: "FlaskConical", Icon: FlaskConical },
  { name: "Telescope", Icon: Telescope },
  { name: "Map", Icon: Map },
  { name: "CookingPot", Icon: CookingPot },
  { name: "Trophy", Icon: Trophy },
  { name: "Puzzle", Icon: Puzzle },

  { name: "NotebookPen", Icon: NotebookPen },
  { name: "Paintbrush", Icon: Paintbrush },
  { name: "MonitorPlay", Icon: MonitorPlay },
  { name: "Smartphone", Icon: Smartphone },
  { name: "Laptop", Icon: Laptop },
  { name: "Bot", Icon: Bot },
  { name: "Cpu", Icon: Cpu },
];

function InterestIcon({ icon }: { icon: string | null }) {
  const matchedIcon = interestIcons.find((item) => item.name === icon);

  const Icon = matchedIcon?.Icon ?? Sparkles;

  return <Icon size={32} strokeWidth={1.5} />;
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
