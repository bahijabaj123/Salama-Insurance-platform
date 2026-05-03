package org.example.salamainsurance.security;

import org.springframework.security.core.AuthenticationException;

public class PendingApprovalException extends AuthenticationException {
    public PendingApprovalException(String msg) {
        super(msg);
    }
}

