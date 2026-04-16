"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import StatsBar from "@/components/StatsBar";
import CustomerCard from "@/components/CustomerCard";
import FeedbackPanel, { FeedbackLevel } from "@/components/FeedbackPanel";
import { CustomerProfile } from "@/lib/gemini";

interface DiffWord {
  word: string;
  missed: boolean;
}

type AppState = "idle" | "loading" | "speaking" | "waiting" | "revealed";

function normalize(t: string) {
  return t
    .toLowerCase()
    .replace(/[,\.!?']/g, "")
    .replace(
      /\b(can|i|get|have|please|a|an|the|let|me|id|like|and|want|just|um|uh|so|yeah|okay|actually|ll)\b/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0
    )
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function calcScore(userAnswer: string, reference: string): number {
  const u = normalize(userAnswer).split(" ").filter(Boolean);
  const r = normalize(reference).split(" ").filter(Boolean);
  let matched = 0;
  r.forEach((w) => {
    if (u.some((uw) => levenshtein(uw, w) <= 1)) matched++;
  });
  return matched / Math.max(r.length, 1);
}

function buildDiff(userAnswer: string | null, orderText: string): DiffWord[] {
  const userWords = userAnswer
    ? normalize(userAnswer).split(" ").filter(Boolean)
    : [];
  return orderText.split(" ").map((word) => {
    const wn = normalize(word);
    if (!wn) return { word, missed: false };
    const matched =
      userAnswer !== null &&
      userWords.some((uw) => levenshtein(uw, wn) <= 1);
    return { word, missed: !matched };
  });
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [answer, setAnswer] = useState("");
  const [diffWords, setDiffWords] = useState<DiffWord[] | null>(null);
  const [feedback, setFeedback] = useState<{
    level: FeedbackLevel;
    message: string;
  } | null>(null);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [audioError, setAudioError] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrl = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const candidateRef = useRef<{ customer: CustomerProfile; audioUrl: string } | null>(null);
  const isPrefetchingRef = useRef(false);

  useEffect(() => {
    fetch("/api/performance")
      .then((r) => r.json())
      .then((d) => {
        setCorrect(d.totals?.correct ?? 0);
        setTotal(d.totals?.total ?? 0);
      })
      .catch(() => {});
  }, []);

  const playAudioUrl = useCallback(
    async (url: string, custName: string) => {
      if (!audioRef.current) return;
      setAudioError("");
      setAppState("speaking");
      setLoadingMsg(`${custName} is speaking...`);

      audioRef.current.src = url;
      audioRef.current.onended = () => {
        setAppState("waiting");
        setLoadingMsg("");
        inputRef.current?.focus();
      };
      audioRef.current.onerror = () => {
        setAppState("waiting");
        setLoadingMsg("");
        setAudioError(
          "Audio playback failed. You can still type and check your answer."
        );
      };
      try {
        await audioRef.current.play();
      } catch (err) {
        console.error(err);
        setAppState("waiting");
        setLoadingMsg("");
        setAudioError(
          "Speech generation failed. You can still type and check your answer."
        );
      }
    },
    []
  );

  const prefetchCandidate = useCallback(async () => {
    if (isPrefetchingRef.current || candidateRef.current) return;
    isPrefetchingRef.current = true;
    try {
      const custRes = await fetch("/api/customer");
      if (!custRes.ok) throw new Error();
      const cust: CustomerProfile = await custRes.json();

      const ttsRes = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cust.orderText }),
      });
      if (!ttsRes.ok) throw new Error();
      const blob = await ttsRes.blob();
      const url = URL.createObjectURL(blob);
      candidateRef.current = { customer: cust, audioUrl: url };
    } catch {
      // 静默失败，点击时回退到实时获取
    } finally {
      isPrefetchingRef.current = false;
    }
  }, []);

  const playAudio = useCallback(
    async (orderText: string, cust: CustomerProfile) => {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: orderText }),
        });
        if (!res.ok) throw new Error("TTS API error");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        currentAudioUrl.current = url;
        await playAudioUrl(url, cust.name);
        prefetchCandidate();
      } catch (err) {
        console.error(err);
        setAppState("waiting");
        setLoadingMsg("");
        setAudioError(
          "Speech generation failed. You can still type and check your answer."
        );
      }
    },
    [playAudioUrl, prefetchCandidate]
  );

  const handleNewCustomer = useCallback(async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (currentAudioUrl.current) {
      URL.revokeObjectURL(currentAudioUrl.current);
      currentAudioUrl.current = null;
    }
    setAnswer("");
    setDiffWords(null);
    setFeedback(null);
    setAudioError("");

    const candidate = candidateRef.current;
    candidateRef.current = null;

    if (candidate) {
      setAppState("loading");
      setCustomer(candidate.customer);
      currentAudioUrl.current = candidate.audioUrl;
      await playAudioUrl(candidate.audioUrl, candidate.customer.name);
    } else {
      setAppState("loading");
      setLoadingMsg("Generating customer...");
      try {
        const res = await fetch("/api/customer");
        if (!res.ok) throw new Error("Customer API error");
        const cust: CustomerProfile = await res.json();
        setCustomer(cust);
        await playAudio(cust.orderText, cust);
      } catch (err) {
        console.error(err);
        setAppState("idle");
        setLoadingMsg("");
        setAudioError("Failed to generate customer. Please try again.");
      }
    }

    prefetchCandidate();
  }, [playAudio, playAudioUrl, prefetchCandidate]);

  const handleReplay = useCallback(() => {
    if (!customer || (appState !== "waiting" && appState !== "revealed")) return;
    if (currentAudioUrl.current) {
      playAudioUrl(currentAudioUrl.current, customer.name);
    } else {
      playAudio(customer.orderText, customer);
    }
  }, [customer, appState, playAudioUrl, playAudio]);

  const handleCheck = useCallback(async () => {
    if (!customer || appState !== "waiting") return;
    const trimmed = answer.trim();
    if (!trimmed) return;

    const score = calcScore(trimmed, customer.canonicalOrder);
    const diff = buildDiff(trimmed, customer.canonicalOrder);
    setDiffWords(diff);
    setAppState("revealed");

    let level: FeedbackLevel;
    let message: string;
    if (score >= 0.85) {
      level = "correct";
      message =
        "Excellent! You got it. Yellow highlights = any words you missed.";
    } else if (score >= 0.55) {
      level = "partial";
      message = "Close! You got most of it. Yellow = what you missed.";
    } else {
      level = "wrong";
      message =
        "Keep practicing! Full order is shown below. Yellow = what you missed.";
    }
    setFeedback({ level, message });

    const isCorrect = score >= 0.85;
    setCorrect((c) => c + (isCorrect ? 1 : 0));
    setTotal((t) => t + 1);

    fetch("/api/performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: customer.name,
        canonicalOrder: customer.canonicalOrder,
        barristaInput: trimmed,
        score,
        correct: isCorrect,
      }),
    }).catch(() => {});
  }, [customer, appState, answer]);

  const handleReveal = useCallback(async () => {
    if (!customer || appState !== "waiting") return;
    const diff = buildDiff(null, customer.canonicalOrder);
    setDiffWords(diff);
    setAppState("revealed");
    setFeedback({
      level: "revealed",
      message: "Answer revealed. Listen carefully next time!",
    });
    setTotal((t) => t + 1);

    fetch("/api/performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: customer.name,
        canonicalOrder: customer.canonicalOrder,
        barristaInput: "",
        score: 0,
        correct: false,
      }),
    }).catch(() => {});
  }, [customer, appState]);

  const isInputActive = appState === "waiting";
  const isSpeaking = appState === "speaking";
  const isLoading = appState === "loading";

  return (
    <main className="min-h-screen bg-[#f9f6f0] py-8 px-4">
      <audio ref={audioRef} />
      <div className="max-w-170 mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-7">
          <div className="w-11 h-11 rounded-full bg-[#00704a] flex items-center justify-center text-white font-bold text-lg shrink-0">
            SB
          </div>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">
              Barista Listening Trainer
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Listen carefully and type what the customer orders
            </p>
          </div>
        </div>

        <StatsBar correct={correct} total={total} />

        <CustomerCard
          customer={customer}
          diffWords={diffWords}
          revealed={appState === "revealed"}
        />

        {/* Speaking / loading indicator */}
        {(isSpeaking || isLoading) && (
          <div className="flex items-center gap-2 text-sm text-[#00704a] mb-3">
            <span className="w-2 h-2 rounded-full bg-[#00704a] animate-pulse" />
            <span>{loadingMsg}</span>
          </div>
        )}

        {/* Audio error */}
        {audioError && (
          <div className="text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 mb-3">
            {audioError}
          </div>
        )}

        {/* Input + Check */}
        <div className="flex gap-2 mt-1">
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            placeholder="Type the items ordered (e.g. grande iced latte, chocolate croissant)..."
            autoComplete="off"
            spellCheck={false}
            className="flex-1 text-sm px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-900 outline-none transition focus:border-[#00704a] focus:ring-2 focus:ring-[#00704a]/10"
          />
          <button
            onClick={handleCheck}
            disabled={!isInputActive || !answer.trim()}
            className="text-sm px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Check
          </button>
        </div>

        {appState === "revealed" && (
          <p className="text-xs text-neutral-400 mt-2">
            Press &ldquo;New Customer&rdquo; to continue.
          </p>
        )}

        {/* Feedback */}
        {feedback && (
          <FeedbackPanel level={feedback.level} message={feedback.message} />
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={handleNewCustomer}
            disabled={isLoading || isSpeaking}
            className="text-sm px-4 py-2 rounded-lg bg-[#00704a] text-white border border-[#00704a] hover:bg-[#005c3b] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? "Loading..." : "New Customer"}
          </button>
          <button
            onClick={handleReveal}
            disabled={appState !== "waiting"}
            className="text-sm px-4 py-2 rounded-lg border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Reveal Answer
          </button>
          <button
            onClick={handleReplay}
            disabled={appState !== "waiting" && appState !== "revealed"}
            className="text-sm px-4 py-2 rounded-lg bg-[#e6f4ee] text-[#00704a] border border-[#b2d9c8] hover:bg-[#d0ecdf] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Replay
          </button>
        </div>
      </div>
    </main>
  );
}
