package org.example.salamainsurance.DTO.admin;

/**
 * One month bucket in the user-growth time series.
 * {@code period} is formatted as {@code YYYY-MM} (e.g. "2026-04").
 */
public class MonthlyUserCountDto {

    private String period;
    private long count;

    public MonthlyUserCountDto() {}

    public MonthlyUserCountDto(String period, long count) {
        this.period = period;
        this.count = count;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }
}
