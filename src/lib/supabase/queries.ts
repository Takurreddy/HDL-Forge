import { createClient } from "./client";
import {
  Problem,
  ProblemListResponse,
  LeaderboardResponse,
  UserRankResponse,
  UserAchievementsResponse,
  Achievement,
  Discussion,
  ProblemSubmission,
} from "../types";

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes("placeholder") &&
    !key.includes("placeholder")
  );
}

export async function supabaseFetchProblems(params?: {
  difficulty?: string;
  category?: string;
  search?: string;
}): Promise<ProblemListResponse | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    let query = supabase.from("problems").select("*", { count: "exact" });

    if (params?.difficulty && params.difficulty !== "all") {
      query = query.eq("difficulty", params.difficulty.toUpperCase());
    }
    if (params?.category && params.category !== "all") {
      query = query.eq("category", params.category);
    }
    if (params?.search) {
      query = query.ilike("title", `%${params.search}%`);
    }

    query = query.order("id", { ascending: true });

    const { data, count, error } = await query;
    if (error || !data) return null;

    return {
      problems: data.map((p) => ({
        id: String(p.id),
        slug: p.slug,
        title: p.title,
        difficulty: (p.difficulty || "EASY").toLowerCase() as "easy" | "medium" | "hard",
        category: p.category,
        language: (p.language || "SYSTEMVERILOG").toLowerCase() as "verilog" | "systemverilog",
        description: p.description,
        inputDescription: p.input_description || "",
        outputDescription: p.output_description || "",
        constraints: p.constraints ? p.constraints.split("\n").filter(Boolean) : [],
        examples: [],
        starterCode: p.starter_code || "",
        timeComplexity: p.time_complexity || undefined,
        spaceComplexity: p.space_complexity || undefined,
        referenceSolution: p.reference_solution || undefined,
        publicTestCases: [],
        publicTestbenches: [],
      })),
      total: count || data.length,
    };
  } catch (err) {
    console.warn("supabaseFetchProblems error:", err);
    return null;
  }
}

export async function supabaseFetchProblemBySlug(slug: string): Promise<Problem | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const { data: p, error } = await supabase
      .from("problems")
      .select("*, test_cases(name, description, input, expected, visibility), testbenches(name, testbench, language, is_public)")
      .eq("slug", slug)
      .single();

    if (error || !p) return null;

    // test_cases visibility is restricted by RLS (only PUBLIC returned to client)
    const publicTestCases = (p.test_cases || [])
      .filter((tc: { visibility?: string }) => !tc.visibility || tc.visibility === "PUBLIC")
      .map((tc: { name: string; description: string; input: string; expected: string }) => ({
        name: tc.name,
        description: tc.description,
        input: tc.input,
        expected: tc.expected,
      }));

    const publicTestbenches = (p.testbenches || [])
      .filter((tb: { is_public?: boolean }) => tb.is_public !== false)
      .map((tb: { name: string; testbench: string; language: string }) => ({
        name: tb.name,
        testbench: tb.testbench,
        language: tb.language,
      }));

    return {
      id: String(p.id),
      slug: p.slug,
      title: p.title,
      difficulty: (p.difficulty || "EASY").toLowerCase() as "easy" | "medium" | "hard",
      category: p.category,
      language: (p.language || "SYSTEMVERILOG").toLowerCase() as "verilog" | "systemverilog",
      description: p.description,
      inputDescription: p.input_description || "",
      outputDescription: p.output_description || "",
      constraints: p.constraints ? p.constraints.split("\n").filter(Boolean) : [],
      examples: [],
      starterCode: p.starter_code || "",
      timeComplexity: p.time_complexity || undefined,
      spaceComplexity: p.space_complexity || undefined,
      referenceSolution: p.reference_solution || undefined,
      publicTestCases,
      publicTestbenches,
    };
  } catch (err) {
    console.warn("supabaseFetchProblemBySlug error:", err);
    return null;
  }
}

export async function supabaseFetchLeaderboard(params?: {
  page?: number;
  limit?: number;
  timeframe?: string;
}): Promise<LeaderboardResponse | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from("leaderboard_view")
      .select("*", { count: "exact" })
      .range(from, to);

    if (error || !data) return null;

    const totalUsers = count || data.length;
    const totalPages = Math.ceil(totalUsers / limit);

    return {
      entries: data.map((entry, idx) => ({
        rank: from + idx + 1,
        userId: entry.user_id,
        username: entry.username,
        displayName: entry.display_name,
        xp: entry.xp || 0,
        level: entry.level || 1,
        solvedCount: entry.solved_count || 0,
        progress: entry.progress || 0,
        streak: entry.streak || 0,
        achievements: entry.achievements || 0,
      })),
      totalUsers,
      page,
      limit,
      totalPages,
    };
  } catch (err) {
    console.warn("supabaseFetchLeaderboard error:", err);
    return null;
  }
}

export async function supabaseFetchMyRank(): Promise<UserRankResponse | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("leaderboard_view")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      rank: data.rank || 1,
      xp: data.xp || 0,
      level: data.level || 1,
      solvedCount: data.solved_count || 0,
      progress: data.progress || 0,
      streak: data.streak || 0,
      achievements: data.achievements || 0,
    };
  } catch (err) {
    console.warn("supabaseFetchMyRank error:", err);
    return null;
  }
}

export async function supabaseFetchAllAchievements(): Promise<Achievement[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .order("id", { ascending: true });

    if (error || !data) return null;

    return data.map((a) => ({
      slug: a.slug,
      name: a.name,
      description: a.description,
      icon: a.icon,
      xpReward: a.xp_reward,
      unlocked: false,
      unlockedAt: null,
      progressCurrent: 0,
      progressTarget: 1,
    }));
  } catch (err) {
    console.warn("supabaseFetchAllAchievements error:", err);
    return null;
  }
}

export async function supabaseFetchMyAchievements(): Promise<UserAchievementsResponse | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: allAchievements, error: achError } = await supabase
      .from("achievements")
      .select("*")
      .order("id", { ascending: true });
    if (achError || !allAchievements) return null;

    const { data: userAchievements, error: uAchError } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", user.id);
    if (uAchError) return null;

    const unlockedMap = new Map<number, string>();
    for (const ua of userAchievements || []) {
      unlockedMap.set(ua.achievement_id, ua.unlocked_at);
    }

    const achievements: Achievement[] = allAchievements.map((a) => {
      const unlockedAt = unlockedMap.get(a.id) || null;
      return {
        slug: a.slug,
        name: a.name,
        description: a.description,
        icon: a.icon,
        xpReward: a.xp_reward,
        unlocked: unlockedAt !== null,
        unlockedAt,
        progressCurrent: unlockedAt !== null ? 1 : 0,
        progressTarget: 1,
      };
    });

    return {
      achievements,
      totalUnlocked: userAchievements?.length || 0,
      totalAvailable: allAchievements.length,
    };
  } catch (err) {
    console.warn("supabaseFetchMyAchievements error:", err);
    return null;
  }
}

export async function supabaseFetchDiscussions(slug: string): Promise<Discussion[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const { data: discussions, error } = await supabase
      .from("discussions")
      .select("*, profiles:user_id(username, display_name)")
      .eq("problem_slug", slug)
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    if (error || !discussions) return null;

    const { data: replies } = await supabase
      .from("discussions")
      .select("*, profiles:user_id(username, display_name)")
      .eq("problem_slug", slug)
      .not("parent_id", "is", null)
      .order("created_at", { ascending: true });

    const replyMap = new Map<number, any[]>();
    for (const r of replies || []) {
      const pId = r.parent_id;
      if (!replyMap.has(pId)) replyMap.set(pId, []);
      replyMap.get(pId)!.push({
        id: r.id,
        content: r.content,
        username: r.profiles?.username || "Unknown",
        displayName: r.profiles?.display_name || null,
        upvotes: r.upvotes || 0,
        isSolution: r.is_solution || false,
        createdAt: r.created_at,
      });
    }

    return discussions.map((d) => ({
      id: d.id,
      content: d.content,
      username: d.profiles?.username || "Unknown",
      displayName: d.profiles?.display_name || null,
      upvotes: d.upvotes || 0,
      isSolution: d.is_solution || false,
      replyCount: (replyMap.get(d.id) || []).length,
      replies: replyMap.get(d.id) || [],
      createdAt: d.created_at,
    }));
  } catch (err) {
    console.warn("supabaseFetchDiscussions error:", err);
    return null;
  }
}

export async function supabaseFetchProblemSubmissions(slug: string): Promise<ProblemSubmission[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: problem } = await supabase
      .from("problems")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!problem) return null;

    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("problem_id", problem.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !data) return null;

    return data.map((s) => ({
      id: s.id,
      score: s.score || 0,
      status: s.status,
      testsPassed: s.tests_passed || 0,
      testsTotal: s.tests_total || 0,
      executionTime: s.execution_time || 0,
      language: (s.language || "systemverilog").toLowerCase(),
      code: s.code,
      createdAt: s.created_at,
    }));
  } catch (err) {
    console.warn("supabaseFetchProblemSubmissions error:", err);
    return null;
  }
}
