import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  X,
  CreditCard,
} from 'lucide-react';
import { POSTS_DATA, POSTS_CATEGORIES } from '../data/postsData';
import { PostArticle, AppSettings } from '../types';

interface PostsDirectoryProps {
  settings: AppSettings;
  onBackToApp: () => void;
  onSelectProductToOrder?: () => void;
}

export const PostsDirectory: React.FC<PostsDirectoryProps> = ({
  settings,
  onBackToApp,
  onSelectProductToOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Articles');
  const [readingArticle, setReadingArticle] = useState<PostArticle | null>(null);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return POSTS_DATA.filter((article) => {
      const matchesCat =
        selectedCategory === 'All Articles' || article.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCat;
      const matchesSearch =
        article.title.toLowerCase().includes(q) ||
        article.description.toLowerCase().includes(q) ||
        article.keywords.some((k) => k.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-200">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0A0A0C]/90 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToApp}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 border border-white/10 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:border-[#D4AF37]/50 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span>Back to Store</span>
          </button>

          <div className="hidden sm:block h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-wider text-white text-sm">
              {settings.brand_name}
            </span>
            <span className="rounded bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2 py-0.5 text-[10px] font-mono text-[#F3E5AB]">
              /posts (100+ Guides)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onSelectProductToOrder) onSelectProductToOrder();
            else onBackToApp();
          }}
          className="rounded-xl px-4 py-1.5 text-xs font-bold text-black transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #F5D77F 0%, #D4AF37 100%)',
          }}
        >
          Get Card Now →
        </button>
      </header>

      {/* Hero Header */}
      <div className="border-b border-white/5 bg-gradient-to-b from-[#111114] to-transparent py-10 sm:py-14 px-4 sm:px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3.5 py-1 text-xs font-medium text-[#F3E5AB]">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Exclusive Knowledge Base & Search Engine Directory</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Virtual Dollar Cards & International Payments in Nepal
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            100+ authoritative guides on paying for ChatGPT Plus, Claude, Facebook Ads, AWS hosting, Netflix, and Steam
            games from Nepal with instant eSewa verification.
          </p>

          {/* Search bar */}
          <div className="max-w-xl mx-auto pt-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search queries (e.g., 'ChatGPT Plus', 'Facebook Ads', 'NRB $500', 'Steam', 'eSewa')..."
                className="w-full rounded-xl bg-neutral-900/90 border border-white/15 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:border-[#D4AF37] focus:outline-none shadow-lg placeholder:text-neutral-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick Static HTML links for Search Engine Bots */}
          <div className="pt-2 text-[11px] text-neutral-500 flex flex-wrap items-center justify-center gap-2">
            <span>Static HTML Crawlers:</span>
            <a href="/post1.html" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline">
              post1.html
            </a>
            <span>•</span>
            <a href="/post2.html" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline">
              post2.html
            </a>
            <span>•</span>
            <a href="/post3.html" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline">
              post3.html
            </a>
            <span>•</span>
            <a href="/post10.html" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline">
              post10.html
            </a>
            <span>•</span>
            <a href="/posts.html" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline">
              posts.html (Index)
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          {POSTS_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#D4AF37] text-black font-bold shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                  : 'bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results counter */}
        <div className="text-xs text-neutral-500 mb-4 flex items-center justify-between">
          <span>
            Showing <strong className="text-white">{filteredArticles.length}</strong> of {POSTS_DATA.length} Articles
          </span>
          {selectedCategory !== 'All Articles' && (
            <span className="text-[#D4AF37]">Filtered by: {selectedCategory}</span>
          )}
        </div>

        {/* Grid of Articles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => setReadingArticle(article)}
              className="group rounded-xl border border-white/10 bg-[#121214] p-5 flex flex-col justify-between hover:border-[#D4AF37]/50 hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-[#D4AF37]">
                    #{article.number} • {article.category}
                  </span>
                  <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {article.readTime}
                  </span>
                </div>

                <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-[#F3E5AB] transition-colors line-clamp-2 leading-snug">
                  {article.title}
                </h3>

                <p className="text-xs text-neutral-400 mt-2 line-clamp-3 leading-relaxed">
                  {article.description}
                </p>

                {/* Keyword tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {article.keywords.slice(0, 3).map((kw, i) => (
                    <span
                      key={i}
                      className="rounded bg-neutral-900 px-2 py-0.5 text-[9px] text-neutral-400 font-mono"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-[#D4AF37] font-semibold">
                <span>Read Full Guide</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-neutral-900/50 p-12 text-center">
            <p className="text-neutral-400 text-sm">No articles matched your search "{searchQuery}".</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All Articles');
              }}
              className="mt-3 text-xs text-[#D4AF37] underline"
            >
              Reset filters & show all 100+ articles
            </button>
          </div>
        )}
      </div>

      {/* Reader Modal */}
      {readingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-3xl rounded-2xl border border-white/20 bg-[#121215] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2 py-0.5 text-[10px] font-mono text-[#F3E5AB]">
                  Guide #{readingArticle.number}
                </span>
                <span className="text-xs text-neutral-400">{readingArticle.category}</span>
              </div>
              <button
                type="button"
                onClick={() => setReadingArticle(null)}
                className="rounded-full p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6 text-neutral-300 text-xs sm:text-sm leading-relaxed">
              <div>
                <h2 className="text-lg sm:text-2xl font-black text-white leading-snug">
                  {readingArticle.title}
                </h2>
                <div className="flex items-center gap-4 text-[11px] text-neutral-500 mt-2">
                  <span>Published: {readingArticle.publishedDate}</span>
                  <span>•</span>
                  <span>{readingArticle.readTime}</span>
                  <span>•</span>
                  <span>By {readingArticle.author}</span>
                </div>
              </div>

              {/* Lead excerpt */}
              <div className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-4 text-neutral-200 italic">
                "{readingArticle.description}"
              </div>

              {/* Body paragraphs */}
              <div className="space-y-4">
                {readingArticle.content.map((p, i) => (
                  <p key={i} className="leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>

              {/* In-Article Conversion Banner */}
              <div className="rounded-xl border border-white/15 bg-gradient-to-r from-neutral-900 to-black p-5 text-center space-y-3">
                <h4 className="text-sm font-bold text-white">Ready to Order Your Virtual Dollar Card?</h4>
                <p className="text-xs text-neutral-400">
                  Instant activation via eSewa. High limits up to $20,000 USD. Works globally on ChatGPT, Ads, Netflix & Steam.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setReadingArticle(null);
                    if (onSelectProductToOrder) onSelectProductToOrder();
                    else onBackToApp();
                  }}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold text-black shadow-lg cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #F5D77F 0%, #D4AF37 100%)',
                  }}
                >
                  Buy Virtual Card with eSewa Now →
                </button>
              </div>

              {/* FAQs */}
              {readingArticle.faq && readingArticle.faq.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-[#D4AF37]" />
                    <span>Frequently Asked Questions</span>
                  </h3>
                  <div className="space-y-2">
                    {readingArticle.faq.map((f, i) => (
                      <div key={i} className="rounded-lg border border-white/10 bg-neutral-950 p-3">
                        <div className="font-semibold text-white text-xs">{f.question}</div>
                        <div className="text-[11px] text-neutral-400 mt-1">{f.answer}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
