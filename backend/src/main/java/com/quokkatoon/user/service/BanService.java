package com.quokkatoon.user.service;

import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;
import com.quokkatoon.report.entity.UserBan;
import com.quokkatoon.report.repository.UserBanRepository;
import com.quokkatoon.user.dto.BanStatusResponse;
import com.quokkatoon.user.dto.BannedUserItem;
import com.quokkatoon.user.entity.User;
import com.quokkatoon.user.entity.UserStatus;
import com.quokkatoon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BanService {

    private final UserRepository userRepository;
    private final UserBanRepository userBanRepository;

    @Transactional(readOnly = true)
    public BanStatusResponse getBanStatus(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || !user.isBanned()) {
            return BanStatusResponse.notBanned();
        }
        return userBanRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                .map(BanStatusResponse::active)
                .orElse(new BanStatusResponse(true, "운영 정책 위반", "7일", null));
    }

    @Transactional(readOnly = true)
    public List<BannedUserItem> listBannedUsers() {
        return userRepository.findByStatusOrderByUpdatedAtDesc(UserStatus.BANNED).stream()
                .map(user -> {
                    UserBan ban = userBanRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId())
                            .orElse(null);
                    return BannedUserItem.from(user, ban);
                })
                .toList();
    }

    @Transactional
    public void unban(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!user.isBanned()) {
            throw new BusinessException(ErrorCode.USER_NOT_BANNED);
        }
        user.unban();
    }
}
