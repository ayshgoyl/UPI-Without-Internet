package com.offlineupi.user.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "user_accounts")
public class UserAccount {

    @Id
    private String mobileNumber;

    private String upiId;
    private String roleName;
    private String languageCode;
    private Instant lastAccessedAt;

    public UserAccount() {
    }

    public UserAccount(String mobileNumber, String upiId, String roleName, String languageCode, Instant lastAccessedAt) {
        this.mobileNumber = mobileNumber;
        this.upiId = upiId;
        this.roleName = roleName;
        this.languageCode = languageCode;
        this.lastAccessedAt = lastAccessedAt;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }

    public String getUpiId() {
        return upiId;
    }

    public void setUpiId(String upiId) {
        this.upiId = upiId;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public String getLanguageCode() {
        return languageCode;
    }

    public void setLanguageCode(String languageCode) {
        this.languageCode = languageCode;
    }

    public Instant getLastAccessedAt() {
        return lastAccessedAt;
    }

    public void setLastAccessedAt(Instant lastAccessedAt) {
        this.lastAccessedAt = lastAccessedAt;
    }
}
