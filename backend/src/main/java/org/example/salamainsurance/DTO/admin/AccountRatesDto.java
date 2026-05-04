package org.example.salamainsurance.DTO.admin;

/**
 * Admin dashboard analytics: enabled-vs-rejected account share.
 *
 * <p>{@code activationRate = enabledUsers / totalUsers * 100}
 * <br>{@code rejectionRate = rejectedRequests / totalUsers * 100}
 *
 * <p>If {@code totalUsers = 0} both rates are 0.0.
 */
public class AccountRatesDto {

    private double activationRate;
    private double rejectionRate;

    public AccountRatesDto() {}

    public AccountRatesDto(double activationRate, double rejectionRate) {
        this.activationRate = activationRate;
        this.rejectionRate = rejectionRate;
    }

    public double getActivationRate() {
        return activationRate;
    }

    public void setActivationRate(double activationRate) {
        this.activationRate = activationRate;
    }

    public double getRejectionRate() {
        return rejectionRate;
    }

    public void setRejectionRate(double rejectionRate) {
        this.rejectionRate = rejectionRate;
    }
}
