package org.example.salamainsurance.DTO.admin;

import java.util.List;

/**
 * Admin dashboard analytics: month-over-month user registration growth.
 *
 * <p>{@code currentVsPreviousPercent = current / previous * 100} (capacity ratio)
 * <br>{@code growthRate = (current - previous) / previous * 100} (signed delta)
 *
 * <p>When the previous month count is 0:
 * <ul>
 *   <li>if current month count {@literal >} 0: both metrics are 100.0</li>
 *   <li>if current month count = 0: both metrics are 0.0</li>
 * </ul>
 */
public class UserGrowthResponse {

    private MonthlyUserCountDto currentMonth;
    private MonthlyUserCountDto previousMonth;
    private double currentVsPreviousPercent;
    private double growthRate;
    private List<MonthlyUserCountDto> series;

    public UserGrowthResponse() {}

    public UserGrowthResponse(MonthlyUserCountDto currentMonth,
                              MonthlyUserCountDto previousMonth,
                              double currentVsPreviousPercent,
                              double growthRate,
                              List<MonthlyUserCountDto> series) {
        this.currentMonth = currentMonth;
        this.previousMonth = previousMonth;
        this.currentVsPreviousPercent = currentVsPreviousPercent;
        this.growthRate = growthRate;
        this.series = series;
    }

    public MonthlyUserCountDto getCurrentMonth() {
        return currentMonth;
    }

    public void setCurrentMonth(MonthlyUserCountDto currentMonth) {
        this.currentMonth = currentMonth;
    }

    public MonthlyUserCountDto getPreviousMonth() {
        return previousMonth;
    }

    public void setPreviousMonth(MonthlyUserCountDto previousMonth) {
        this.previousMonth = previousMonth;
    }

    public double getCurrentVsPreviousPercent() {
        return currentVsPreviousPercent;
    }

    public void setCurrentVsPreviousPercent(double currentVsPreviousPercent) {
        this.currentVsPreviousPercent = currentVsPreviousPercent;
    }

    public double getGrowthRate() {
        return growthRate;
    }

    public void setGrowthRate(double growthRate) {
        this.growthRate = growthRate;
    }

    public List<MonthlyUserCountDto> getSeries() {
        return series;
    }

    public void setSeries(List<MonthlyUserCountDto> series) {
        this.series = series;
    }
}
