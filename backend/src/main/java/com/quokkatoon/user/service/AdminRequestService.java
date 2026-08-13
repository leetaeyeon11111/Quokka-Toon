package com.quokkatoon.user.service;

import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;
import com.quokkatoon.user.dto.AdminRequestResponse;
import com.quokkatoon.user.dto.AdminUserItem;
import com.quokkatoon.user.entity.AdminRequest;
import com.quokkatoon.user.entity.AdminRequestStatus;
import com.quokkatoon.user.entity.Role;
import com.quokkatoon.user.entity.User;
import com.quokkatoon.user.repository.AdminRequestRepository;
import com.quokkatoon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminRequestService {

    private final AdminRequestRepository adminRequestRepository;
    private final UserRepository userRepository;

    // 유저: 관리자 승격 요청 (이미 있으면 PENDING 으로 재요청)
    @Transactional
    public void request(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (user.isAdmin()) {
            throw new BusinessException(ErrorCode.ALREADY_ADMIN);
        }
        adminRequestRepository.findByUserId(userId)
                .ifPresentOrElse(
                        AdminRequest::reopen,
                        () -> adminRequestRepository.save(AdminRequest.builder().user(user).build())
                );
    }

    // 유저: 내 요청 상태 (없으면 null)
    @Transactional(readOnly = true)
    public AdminRequestResponse getMine(Long userId) {
        return adminRequestRepository.findByUserId(userId)
                .map(AdminRequestResponse::from)
                .orElse(null);
    }

    // 관리자: 대기 중 요청 목록
    @Transactional(readOnly = true)
    public List<AdminRequestResponse> getPending() {
        return adminRequestRepository.findByStatusOrderByCreatedAtDesc(AdminRequestStatus.PENDING)
                .stream().map(AdminRequestResponse::from).toList();
    }

    // 관리자: 승인 → 해당 유저 role = ADMIN
    @Transactional
    public void approve(Long requestId) {
        AdminRequest req = getRequest(requestId);
        req.getUser().promoteToAdmin();
        req.approve();
    }

    // 관리자: 거절
    @Transactional
    public void reject(Long requestId) {
        AdminRequest req = getRequest(requestId);
        req.reject();
    }

    private AdminRequest getRequest(Long requestId) {
        return adminRequestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ADMIN_REQUEST_NOT_FOUND));
    }

    // ---- 관리자 목록/해제 (기준은 user.role) ----

    // 현재 관리자 목록
    @Transactional(readOnly = true)
    public List<AdminUserItem> getAdmins() {
        return userRepository.findByRoleOrderByCreatedAtDesc(Role.ADMIN)
                .stream().map(AdminUserItem::from).toList();
    }

    // 관리자 해제(강등). 본인은 해제 불가.
    @Transactional
    public void revokeAdmin(Long targetUserId, Long currentAdminId) {
        if (targetUserId.equals(currentAdminId)) {
            throw new BusinessException(ErrorCode.CANNOT_REVOKE_SELF);
        }
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (!target.isAdmin()) {
            throw new BusinessException(ErrorCode.NOT_ADMIN);
        }
        target.demoteToUser();
        // 승격 요청 이력이 있으면 제거해 재요청 가능하게
        adminRequestRepository.findByUserId(targetUserId)
                .ifPresent(adminRequestRepository::delete);
    }
}
