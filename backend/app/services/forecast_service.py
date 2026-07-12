import json
import numpy as np
from typing import Optional

from app.utils.logger import get_logger

logger = get_logger(__name__)


class ForecastService:

    @staticmethod
    async def forecast_price(
        historical_prices: list[float],
        periods: int = 3,
    ) -> dict:
        if len(historical_prices) < 2:
            return {
                "forecast": [],
                "method": "insufficient_data",
                "confidence": 0.0,
            }
        try:
            from sklearn.linear_model import LinearRegression
            X = np.arange(len(historical_prices)).reshape(-1, 1)
            y = np.array(historical_prices)
            model = LinearRegression()
            model.fit(X, y)
            future_X = np.arange(len(historical_prices), len(historical_prices) + periods).reshape(-1, 1)
            predictions = model.predict(future_X).tolist()
            r2 = model.score(X, y)
            confidence = max(0.0, min(1.0, r2))
            return {
                "forecast": [round(p, 2) for p in predictions],
                "method": "linear_regression",
                "confidence": round(confidence, 4),
            }
        except ImportError:
            logger.warning("scikit-learn not available, using simple moving average")
            avg = np.mean(historical_prices)
            return {
                "forecast": [round(avg, 2)] * periods,
                "method": "moving_average",
                "confidence": 0.5,
            }

    @staticmethod
    async def classify_risk(
        delivery_score: Optional[float],
        quality_score: Optional[float],
        late_deliveries: int = 0,
        total_orders: int = 1,
    ) -> dict:
        risk_score = 0.0
        factors = []

        if delivery_score is not None:
            if delivery_score < 60:
                risk_score += 0.4
                factors.append("low_delivery_score")
            elif delivery_score < 80:
                risk_score += 0.2
                factors.append("medium_delivery_score")

        if quality_score is not None:
            if quality_score < 60:
                risk_score += 0.3
                factors.append("low_quality_score")
            elif quality_score < 80:
                risk_score += 0.15
                factors.append("medium_quality_score")

        if total_orders > 0:
            late_ratio = late_deliveries / total_orders
            if late_ratio > 0.3:
                risk_score += 0.3
                factors.append("high_late_delivery_ratio")
            elif late_ratio > 0.1:
                risk_score += 0.15
                factors.append("medium_late_delivery_ratio")

        risk_score = min(1.0, risk_score)

        if risk_score >= 0.7:
            level = "high"
        elif risk_score >= 0.4:
            level = "medium"
        else:
            level = "low"

        return {
            "risk_level": level,
            "risk_score": round(risk_score, 4),
            "factors": factors,
        }

    @staticmethod
    async def budget_recommendation(
        total_budget: float,
        allocated: float,
        pending_requests: list[float],
    ) -> dict:
        remaining = total_budget - allocated
        total_pending = sum(pending_requests)
        status = "healthy"

        if remaining <= 0:
            status = "exhausted"
        elif total_pending > remaining:
            status = "overcommitted"
        elif remaining < total_budget * 0.1:
            status = "critical"

        return {
            "total_budget": total_budget,
            "allocated": allocated,
            "remaining": round(remaining, 2),
            "pending_total": round(total_pending, 2),
            "status": status,
            "recommendation": ForecastService._get_budget_recommendation(status, remaining),
        }

    @staticmethod
    def _get_budget_recommendation(status: str, remaining: float) -> str:
        recommendations = {
            "healthy": "Budget is in good shape. Continue normal procurement operations.",
            "exhausted": "Budget is fully exhausted. No new procurement requests can be approved.",
            "overcommitted": f"Pending requests exceed remaining budget (Rp{remaining:,.0f}). Prioritize critical procurements.",
            "critical": f"Only Rp{remaining:,.0f} remaining. Freeze non-essential procurement.",
        }
        return recommendations.get(status, "Monitor budget closely.")

    @staticmethod
    async def smart_buy_recommendation(
        supplier_data: list[dict],
    ) -> dict:
        if not supplier_data:
            return {
                "recommendation": "No supplier data available.",
                "top_supplier": None,
            }

        scored = []
        for s in supplier_data:
            score = 0.0
            if s.get("delivery_score"):
                score += s["delivery_score"] * 0.4
            if s.get("quality_score"):
                score += s["quality_score"] * 0.4
            if s.get("price_competitiveness", 0.5):
                score += s["price_competitiveness"] * 0.2
            scored.append((score, s))

        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[0][1]

        return {
            "recommendation": f"Recommended supplier: {top.get('name', 'Unknown')} with composite score {scored[0][0]:.2f}",
            "top_supplier": {
                "name": top.get("name"),
                "score": round(scored[0][0], 4),
                "delivery_score": top.get("delivery_score"),
                "quality_score": top.get("quality_score"),
            },
            "all_scores": [
                {"name": s[1].get("name"), "score": round(s[0], 4)} for s in scored
            ],
        }
