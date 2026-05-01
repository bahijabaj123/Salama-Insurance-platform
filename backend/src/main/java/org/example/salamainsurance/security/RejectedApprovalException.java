package org.example.salamainsurance.security;

import org.springframework.security.core.AuthenticationException;

public class RejectedApprovalException extends AuthenticationException {
    public RejectedApprovalException(String msg) {
        super(msg);
    }
}

