package com.quokkatoon.user.repository;

import com.quokkatoon.user.entity.SocialAccount;
import com.quokkatoon.user.entity.SocialProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SocialAccountRepository extends JpaRepository<SocialAccount, Long> {
    Optional<SocialAccount> findByProviderAndProviderUid(SocialProvider provider, String providerUid);
}
