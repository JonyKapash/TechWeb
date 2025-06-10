"use client";

import { useTheme } from "@/context/ThemeContext";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(true);

  // Initialize search query from URL
  useEffect(() => {
    const queryParam = searchParams.get("q");
    if (queryParam) {
      setSearchQuery(queryParam);
      setIsSearchOpen(true);
    }
  }, [searchParams]);

  // Check if refresh is allowed (once per day)
  useEffect(() => {
    const lastRefresh = localStorage.getItem("lastArticleRefresh");
    if (lastRefresh) {
      const last = new Date(lastRefresh);
      const now = new Date();
      const diff = now.getTime() - last.getTime();
      if (diff < 24 * 60 * 60 * 1000) {
        setCanRefresh(false);
      }
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/");
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    router.push("/");
    setIsSearchOpen(false);
  };

  const handleRefreshArticles = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/articles/sync", { method: "POST" });
      if (!res.ok) throw new Error("Failed to refresh articles");
      localStorage.setItem("lastArticleRefresh", new Date().toISOString());
      setCanRefresh(false);
      toast.success("Articles refreshed successfully!");
      router.refresh();
    } catch (err) {
      toast.error("Failed to refresh articles");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-white/10 bg-violet-50/90 dark:bg-violet-950/90 backdrop-blur supports-[backdrop-filter]:bg-violet-50/90 dark:supports-[backdrop-filter]:bg-violet-950/90">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" onClick={clearSearch} className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-violet-400 dark:from-violet-400 dark:to-violet-200 bg-clip-text text-transparent hover:scale-105 transition-all duration-300">
              TechWeb
            </h1>
          </Link>

          {/* Right side controls */}
          <div className="flex items-center gap-4">
            {/* Refresh Articles Button */}
            <button
              type="button"
              className={`btn-primary flex items-center gap-2 ${
                !canRefresh ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handleRefreshArticles}
              disabled={!canRefresh || isRefreshing}
              title={
                canRefresh ? "Refresh articles" : "You can refresh once per day"
              }
            >
              {isRefreshing ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l5-5-5-5v4a10 10 0 100 20v-2a8 8 0 01-8-8z"
                  />
                </svg>
              ) : (
                <>
                  <span>רענן מאמרים</span>
                </>
              )}
            </button>
            {/* Search button */}
            <button
              type="button"
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <span className="sr-only">Search</span>
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>

            {/* Theme toggle */}
            <button
              type="button"
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              onClick={toggleTheme}
            >
              <span className="sr-only">Toggle theme</span>
              {theme === "dark" ? (
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search overlay */}
      {isSearchOpen && (
        <div className="absolute inset-x-0 top-full border-b border-gray-200 dark:border-white/10 bg-white/90 dark:bg-surface-900/90 backdrop-blur supports-[backdrop-filter]:bg-white/90 dark:supports-[backdrop-filter]:bg-surface-900/90">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <form onSubmit={handleSearch} className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-white/60" />
              <input
                type="search"
                placeholder="חיפוש מאמרים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full bg-gray-100 dark:bg-surface-800 py-2 pr-11 pl-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-violet-500"
                dir="rtl"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-white/60 dark:hover:text-white/80"
                >
                  ✕
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
