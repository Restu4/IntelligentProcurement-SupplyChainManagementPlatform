"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Eye, EyeOff } from "lucide-react";
import { api, tokenStore } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.login(username, password);
      tokenStore.save(res);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center px-8 bg-white dark:bg-primary-900">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center shadow-xl shadow-secondary-500/30">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-900 dark:text-white">
                SmartProcure
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI Procurement Platform
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-primary-900 dark:text-white mb-2">
            Welcome back
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Sign in to your SmartProcure account
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Demo credentials:{" "}
            <span className="font-mono text-secondary-600 dark:text-secondary-400">
              admin / admin123
            </span>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-secondary-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-500 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-lg">
          <Bot className="w-20 h-20 text-secondary-400 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-4">
            Intelligent Procurement
          </h2>
          <p className="text-lg text-gray-300 leading-relaxed">
            AI-powered procurement platform that helps you manage suppliers,
            budgets, and purchase orders with intelligent insights.
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <div className="glass px-4 py-2 rounded-lg text-white text-sm">
              RAG-Powered
            </div>
            <div className="glass px-4 py-2 rounded-lg text-white text-sm">
              AI Forecasting
            </div>
            <div className="glass px-4 py-2 rounded-lg text-white text-sm">
              Smart Analytics
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
