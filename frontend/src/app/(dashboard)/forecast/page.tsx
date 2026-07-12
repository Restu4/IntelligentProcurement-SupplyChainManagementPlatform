"use client";

import { TrendingUp, TrendingDown, Zap } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const priceHistory = [
  { month: "Jul", actual: 120, predicted: 122 },
  { month: "Aug", actual: 125, predicted: 124 },
  { month: "Sep", actual: 118, predicted: 120 },
  { month: "Oct", actual: 130, predicted: 128 },
  { month: "Nov", actual: 135, predicted: 133 },
  { month: "Dec", actual: 140, predicted: 138 },
  { month: "Jan", predicted: 142 },
  { month: "Feb", predicted: 145 },
  { month: "Mar", predicted: 148 },
];

export default function ForecastPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary-900 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
          <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-secondary-500" />
          AI Forecast
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Intelligent price prediction and procurement recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="widget-card">
          <p className="text-sm text-gray-500">Current Price Index</p>
          <p className="text-2xl font-bold text-primary-900 dark:text-white">140.2</p>
          <span className="text-xs text-green-500 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +3.8% this month
          </span>
        </div>
        <div className="widget-card">
          <p className="text-sm text-gray-500">Next Month Forecast</p>
          <p className="text-2xl font-bold text-secondary-500">145.6</p>
          <span className="text-xs text-green-500 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +3.9% predicted
          </span>
        </div>
        <div className="widget-card">
          <p className="text-sm text-gray-500">Confidence Interval</p>
          <p className="text-2xl font-bold text-accent-500">92.4%</p>
          <span className="text-xs text-gray-400 mt-1">High confidence</span>
        </div>
        <div className="widget-card">
          <p className="text-sm text-gray-500">Buy Recommendation</p>
          <p className="text-lg font-bold text-green-500 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Buy Now
          </p>
          <span className="text-xs text-gray-400 mt-1">Prices expected to rise</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 widget-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-primary-900 dark:text-white">
                Price Prediction
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Historical data + AI forecast
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary-500" />
                <span className="text-gray-500">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent-500" />
                <span className="text-gray-500">Forecast</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceHistory}>
                <defs>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} className="text-gray-400" />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} className="text-gray-400" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(15,23,42,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }} />
                <Area type="monotone" dataKey="predicted" stroke="#3B82F6" strokeWidth={2} fill="url(#forecastGrad)" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="actual" stroke="#14B8A6" strokeWidth={2} dot={{ fill: "#14B8A6" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="widget-card">
          <h3 className="text-lg font-semibold text-primary-900 dark:text-white mb-4">
            Smart Buy Recommendation
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-secondary-500/10 to-secondary-600/5 border border-secondary-500/20">
              <p className="text-sm font-semibold text-secondary-600 dark:text-secondary-400">
                Recommended: PT Karya Mandiri
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Best price-quality ratio with 94% quality score
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">PT Karya Mandiri</span>
                <span className="font-semibold text-green-500">94%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">PT ABC</span>
                <span className="font-semibold text-secondary-500">92%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">CV Sukses Abadi</span>
                <span className="font-semibold text-accent-500">87%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">PT Maju Jaya</span>
                <span className="font-semibold text-yellow-500">80%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">PT XYZ</span>
                <span className="font-semibold text-red-500">72%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
