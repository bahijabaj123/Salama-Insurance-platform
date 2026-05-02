package org.example.salamainsurance.DTO.admin;

public class UserSummaryDto {
    private long totalUsers;
    private long totalClients;
    private long totalAssureurs;
    private long totalExperts;
    private long totalAdmins;
    private long pendingApprovals;
    private long rejectedRequests;
    private long lockedUsers;
    private long enabledUsers;
    private long disabledUsers;

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalClients() {
        return totalClients;
    }

    public void setTotalClients(long totalClients) {
        this.totalClients = totalClients;
    }

    public long getTotalAssureurs() {
        return totalAssureurs;
    }

    public void setTotalAssureurs(long totalAssureurs) {
        this.totalAssureurs = totalAssureurs;
    }

    public long getTotalExperts() {
        return totalExperts;
    }

    public void setTotalExperts(long totalExperts) {
        this.totalExperts = totalExperts;
    }

    public long getTotalAdmins() {
        return totalAdmins;
    }

    public void setTotalAdmins(long totalAdmins) {
        this.totalAdmins = totalAdmins;
    }

    public long getPendingApprovals() {
        return pendingApprovals;
    }

    public void setPendingApprovals(long pendingApprovals) {
        this.pendingApprovals = pendingApprovals;
    }

    public long getRejectedRequests() {
        return rejectedRequests;
    }

    public void setRejectedRequests(long rejectedRequests) {
        this.rejectedRequests = rejectedRequests;
    }

    public long getLockedUsers() {
        return lockedUsers;
    }

    public void setLockedUsers(long lockedUsers) {
        this.lockedUsers = lockedUsers;
    }

    public long getEnabledUsers() {
        return enabledUsers;
    }

    public void setEnabledUsers(long enabledUsers) {
        this.enabledUsers = enabledUsers;
    }

    public long getDisabledUsers() {
        return disabledUsers;
    }

    public void setDisabledUsers(long disabledUsers) {
        this.disabledUsers = disabledUsers;
    }
}

