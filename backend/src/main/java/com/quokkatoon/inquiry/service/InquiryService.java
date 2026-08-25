package com.quokkatoon.inquiry.service;

import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;
import com.quokkatoon.inquiry.dto.InquiryCreateRequest;
import com.quokkatoon.inquiry.dto.InquiryResponse;
import com.quokkatoon.inquiry.entity.Inquiry;
import com.quokkatoon.inquiry.entity.InquiryAnswer;
import com.quokkatoon.inquiry.entity.InquiryCategory;
import com.quokkatoon.inquiry.repository.InquiryAnswerRepository;
import com.quokkatoon.inquiry.repository.InquiryRepository;
import com.quokkatoon.user.entity.User;
import com.quokkatoon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InquiryService {

    private final InquiryRepository inquiryRepository;
    private final InquiryAnswerRepository answerRepository;
    private final UserRepository userRepository;

    @Transactional
    public Long create(Long userId, InquiryCreateRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        Inquiry inquiry = Inquiry.builder()
                .user(user)
                .category(InquiryCategory.from(req.category()))
                .title(req.title())
                .content(req.content())
                .build();
        return inquiryRepository.save(inquiry).getId();
    }

    @Transactional(readOnly = true)
    public List<InquiryResponse> getMine(Long userId) {
        return toResponses(inquiryRepository.findByUserIdOrderByCreatedAtDesc(userId), userId);
    }

    @Transactional(readOnly = true)
    public List<InquiryResponse> getAll() {
        return toResponses(inquiryRepository.findAllByOrderByCreatedAtDesc(), null);
    }

    // 답변 등록/수정 → 상태 DONE
    @Transactional
    public void answer(Long inquiryId, Long adminId, String content) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INQUIRY_NOT_FOUND));
        answerRepository.findByInquiryId(inquiryId)
                .ifPresentOrElse(
                        a -> a.update(content, adminId),
                        () -> answerRepository.save(InquiryAnswer.builder()
                                .inquiryId(inquiryId).adminId(adminId).content(content).build())
                );
        inquiry.markDone();
    }

    @Transactional
    public void delete(Long inquiryId) {
        if (!inquiryRepository.existsById(inquiryId)) {
            throw new BusinessException(ErrorCode.INQUIRY_NOT_FOUND);
        }
        answerRepository.deleteByInquiryId(inquiryId);
        inquiryRepository.deleteById(inquiryId);
    }

    // 문의 목록 + 답변(+처리 관리자 닉네임)을 한 번에 매핑 (N+1 방지)
    private List<InquiryResponse> toResponses(List<Inquiry> inquiries, Long currentUserId) {
        if (inquiries.isEmpty()) return List.of();
        List<Long> ids = inquiries.stream().map(Inquiry::getId).toList();
        Map<Long, InquiryAnswer> answers = answerRepository.findByInquiryIdIn(ids).stream()
                .collect(Collectors.toMap(InquiryAnswer::getInquiryId, Function.identity(),
                        (a, b) -> a));
        // 답변 관리자 닉네임 일괄 조회
        Set<Long> adminIds = answers.values().stream()
                .map(InquiryAnswer::getAdminId)
                .collect(Collectors.toSet());
        Map<Long, String> adminNames = adminIds.isEmpty() ? Map.of()
                : userRepository.findAllById(adminIds).stream()
                        .collect(Collectors.toMap(User::getId, User::getNickname));
        return inquiries.stream()
                .map(inq -> {
                    InquiryAnswer answer = answers.get(inq.getId());
                    String answeredByName = answer == null ? null : adminNames.get(answer.getAdminId());
                    return InquiryResponse.of(inq, answer, answeredByName, currentUserId);
                })
                .toList();
    }
}
