package org.example.salamainsurance.DTO.admin;

public class UnreadNotificationCountResponse {

    private long count;

    public UnreadNotificationCountResponse() {}

    public UnreadNotificationCountResponse(long count) {
        this.count = count;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }
}
