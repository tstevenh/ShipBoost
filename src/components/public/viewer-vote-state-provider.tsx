"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { authClient } from "@/lib/auth-client";

type ViewerVotePayload = {
  dailyVotesRemaining: number;
  upvotedToolIds: string[];
};

type VoteMutationResult = {
  hasUpvoted: boolean;
  dailyVotesRemaining: number;
};

type ViewerVoteStateContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  upvotedToolIds: ReadonlySet<string>;
  dailyVotesRemaining: number | null;
  applyVoteResult: (toolId: string, result: VoteMutationResult) => void;
};

const ViewerVoteStateContext =
  createContext<ViewerVoteStateContextValue | null>(null);

export function ViewerVoteStateProvider({
  children,
  toolIds,
}: {
  children: ReactNode;
  toolIds: string[];
}) {
  const { data: session, isPending } = authClient.useSession();
  const [upvotedToolIds, setUpvotedToolIds] = useState<Set<string>>(new Set());
  const [dailyVotesRemaining, setDailyVotesRemaining] = useState<number | null>(
    null,
  );
  const [isLoadingVotes, setIsLoadingVotes] = useState(false);
  const uniqueToolIds = Array.from(new Set(toolIds));
  const toolIdsKey = uniqueToolIds.join(",");

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!session?.user.id) {
      setUpvotedToolIds(new Set());
      setDailyVotesRemaining(null);
      setIsLoadingVotes(false);
      return;
    }

    if (uniqueToolIds.length === 0) {
      setUpvotedToolIds(new Set());
      setDailyVotesRemaining(null);
      setIsLoadingVotes(false);
      return;
    }

    const controller = new AbortController();
    const searchParams = new URLSearchParams();
    uniqueToolIds.forEach((toolId) => {
      searchParams.append("toolId", toolId);
    });

    setIsLoadingVotes(true);

    void (async () => {
      try {
        const response = await fetch(`/api/me/tool-votes?${searchParams.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          setUpvotedToolIds(new Set());
          setDailyVotesRemaining(null);
          return;
        }

        const payload = (await response.json().catch(() => null)) as
          | { data?: ViewerVotePayload }
          | null;

        if (!response.ok || !payload?.data) {
          throw new Error("Unable to load viewer vote state.");
        }

        setUpvotedToolIds(new Set(payload.data.upvotedToolIds));
        setDailyVotesRemaining(payload.data.dailyVotesRemaining);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Unable to load viewer vote state", error);
        setUpvotedToolIds(new Set());
        setDailyVotesRemaining(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingVotes(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [isPending, session?.user.id, toolIdsKey]);

  function applyVoteResult(toolId: string, result: VoteMutationResult) {
    setUpvotedToolIds((currentToolIds) => {
      const nextToolIds = new Set(currentToolIds);

      if (result.hasUpvoted) {
        nextToolIds.add(toolId);
      } else {
        nextToolIds.delete(toolId);
      }

      return nextToolIds;
    });
    setDailyVotesRemaining(result.dailyVotesRemaining);
  }

  return (
    <ViewerVoteStateContext.Provider
      value={{
        isAuthenticated: Boolean(session?.user.id),
        isLoading: isPending || isLoadingVotes,
        upvotedToolIds,
        dailyVotesRemaining,
        applyVoteResult,
      }}
    >
      {children}
    </ViewerVoteStateContext.Provider>
  );
}

export function useViewerVoteState(toolId: string) {
  const context = useContext(ViewerVoteStateContext);

  return {
    isAuthenticated: context?.isAuthenticated ?? false,
    isLoading: context?.isLoading ?? false,
    hasUpvoted: context?.upvotedToolIds.has(toolId) ?? false,
    dailyVotesRemaining: context?.dailyVotesRemaining ?? null,
    applyVoteResult: context?.applyVoteResult,
  };
}
