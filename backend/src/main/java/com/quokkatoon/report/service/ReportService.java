package com.quokkatoon.report.service;

import com.quokkatoon.board.entity.Comment;
import com.quokkatoon.board.entity.Post;
import com.quokkatoon.board.repository.CommentRepository;
import com.quokkatoon.board.repository.PostRepository;
import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;
import com.quokkatoon.report.dto.BanRequest;
import com.quokkatoon.report.dto.ReportCreateRequest;
import com.quokkatoon.report.dto.ReportResponse;
import com.quokkatoon.report.entity.*;
import com.quokkatoon.report.repository.ReportRepository;
import com.quokkatoon.report.repository.UserBanRepository;
import com.quokkatoon.user.entity.User;
import com.quokkatoon.user.repository.UserRepository;
import com.quokkatoon.level.service.ExperienceService;
import com.quokkatoon.review.entity.Review;
import com.quokkatoon.review.repository.ReviewLikeRepository;
import com.quokkatoon.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserBanRepository userBanRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final ReviewLikeRepository reviewLikeRepository;
    private final ExperienceService experienceService;

    // 사용자: 신고 접수. 대상 글/댓글의 작성자를 피신고자로 기록.
    @Transactional
    public Long create(Long reporterId, ReportCreateRequest req) {
        ReportTargetType targetType = ReportTargetType.from(req.targetType());
        Long targetUserId = resolveTargetUserId(targetType, req.targetId());

        Report report = Report.builder()
                .reporterId(reporterId)
                .targetType(targetType)
                .targetId(req.targetId())
                .targetUserId(targetUserId)
                .reportType(ReportType.from(req.type()))
                .build();
        return reportRepository.save(report).getId();
    }

    // 관리자: 미처리 신고 목록
    @Transactional(readOnly = true)
    public List<ReportResponse> getPending() {
        return reportRepository.findByStatusOrderByCreatedAtDesc(ReportStatus.PENDING).stream()
                .map(this::toResponse)
                .toList();
    }

    // 관리자: 신고 반려 처리
    @Transactional
    public void reject(Long reportId, Long adminId) {
        Report report = getReport(reportId);
        report.handle(ReportStatus.REJECTED, adminId);
    }

    // 관리자: 작성자 벤 (+선택적 게시글 삭제) 후 신고 처리 완료
    @Transactional
    public void ban(Long reportId, Long adminId, BanRequest req) {
        Report report = getReport(reportId);

        User target = userRepository.findById(report.getTargetUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        target.ban();

        BanDuration duration = BanDuration.fromLabel(req.duration());
        userBanRepository.save(UserBan.builder()
                .userId(target.getId())
                .adminId(adminId)
                .reportId(report.getId())
                .durationType(duration)
                .expiresAt(duration.expiresAt(LocalDateTime.now()))
                .memo(req.reason())
                .deleteContent(req.deletePost())
                .build());

        if (req.deletePost()) deleteReportedContent(report);

        report.handle(ReportStatus.RESOLVED, adminId);
    }

    private Long resolveTargetUserId(ReportTargetType targetType, Long targetId) {
        if (targetType == ReportTargetType.POST) {
            return postRepository.findById(targetId)
                    .map(p -> p.getUser().getId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        }
        if (targetType == ReportTargetType.COMMENT) {
            return commentRepository.findById(targetId)
                    .map(c -> c.getUser().getId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
        }
        if (targetType == ReportTargetType.REVIEW) {
            return reviewRepository.findById(targetId)
                    .map(r -> r.getUser().getId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));
        }
        throw new BusinessException(ErrorCode.INVALID_REQUEST);
    }

    private ReportResponse toResponse(Report r) {
        String author = "(삭제됨)";
        String title = "(삭제된 대상)";
        String board = "-";

        if (r.getTargetType() == ReportTargetType.POST) {
            Post post = postRepository.findById(r.getTargetId()).orElse(null);
            if (post != null) {
                author = post.getUser().getNickname();
                title = post.getTitle();
                board = "FREE".equals(post.getCategory().getCode()) ? "자유게시판" : "웹툰게시판";
            }
        } else if (r.getTargetType() == ReportTargetType.COMMENT) {
            Comment comment = commentRepository.findById(r.getTargetId()).orElse(null);
            if (comment != null) {
                author = comment.getUser().getNickname();
                String content = comment.getContent();
                title = content.length() > 40 ? content.substring(0, 40) + "…" : content;
                board = "댓글";
            }
        } else if (r.getTargetType() == ReportTargetType.REVIEW) {
            Review review = reviewRepository.findById(r.getTargetId()).orElse(null);
            if (review != null) {
                author = review.getUser().getNickname();
                String content = review.getContent();
                title = content.length() > 40 ? content.substring(0, 40) + "…" : content;
                board = "정식 리뷰";
            }
        }
        return ReportResponse.of(r, author, title, board);
    }

    private Report getReport(Long reportId) {
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REPORT_NOT_FOUND));
    }

    private void deleteReportedContent(Report report) {
        if (report.getTargetType() == ReportTargetType.POST) {
            Post post = postRepository.findById(report.getTargetId()).orElse(null);
            if (post == null || post.isDeleted()) return;
            post.softDelete();
            experienceService.reverseAllForReference("POST", post.getId());
            for (Comment comment : commentRepository.findByPostIdOrderByCreatedAtAsc(post.getId())) {
                if (!comment.isDeleted()) comment.softDelete();
                experienceService.reverseAllForReference("COMMENT", comment.getId());
            }
        } else if (report.getTargetType() == ReportTargetType.COMMENT) {
            Comment comment = commentRepository.findById(report.getTargetId()).orElse(null);
            if (comment == null || comment.isDeleted()) return;
            comment.softDelete();
            comment.getPost().decreaseComment();
            experienceService.reverseAllForReference("COMMENT", comment.getId());
        } else if (report.getTargetType() == ReportTargetType.REVIEW) {
            Review review = reviewRepository.findById(report.getTargetId()).orElse(null);
            if (review == null || review.isDeleted()) return;
            review.softDelete();
            reviewLikeRepository.deleteAllByReviewId(review.getId());
            experienceService.reverseAllForReference("REVIEW", review.getId());
        }
    }
}
