import { Difficulty } from "@/lib/types";

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  size?: "sm" | "md";
}

const DIFFICULTY_STYLES: Record<Difficulty, { text: string; bg: string; border: string }> = {
  easy: {
<<<<<<< HEAD
    text: "text-emerald-700 dark:text-[#00B8A3]",
    bg: "bg-emerald-500/10 dark:bg-[#00B8A3]/10",
    border: "border-emerald-500/20 dark:border-[#00B8A3]/20",
  },
  medium: {
    text: "text-amber-700 dark:text-[#FFC01E]",
    bg: "bg-amber-500/10 dark:bg-[#FFC01E]/10",
    border: "border-amber-500/20 dark:border-[#FFC01E]/20",
  },
  hard: {
    text: "text-rose-700 dark:text-[#FF375F]",
    bg: "bg-rose-500/10 dark:bg-[#FF375F]/10",
    border: "border-rose-500/20 dark:border-[#FF375F]/20",
=======
    text: "text-[#00B8A3]",
    bg: "bg-[#00B8A3]/10",
    border: "border-[#00B8A3]/20",
  },
  medium: {
    text: "text-[#FFC01E]",
    bg: "bg-[#FFC01E]/10",
    border: "border-[#FFC01E]/20",
  },
  hard: {
    text: "text-[#FF375F]",
    bg: "bg-[#FF375F]/10",
    border: "border-[#FF375F]/20",
>>>>>>> friend/Bvs_SubBranch
  },
};

export default function DifficultyBadge({
  difficulty,
  size = "sm",
}: DifficultyBadgeProps) {
  const style = DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.easy;
  const sizeClasses =
    size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold capitalize tracking-tight ${style.text} ${style.bg} ${style.border} ${sizeClasses}`}
    >
      {difficulty}
    </span>
  );
}
