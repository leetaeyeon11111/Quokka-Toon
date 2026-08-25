package com.quokkatoon.board.service;

import com.quokkatoon.board.dto.*;
import com.quokkatoon.board.entity.*;
import com.quokkatoon.board.repository.*;
import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;
import com.quokkatoon.global.validation.ContentValidator;
import com.quokkatoon.level.dto.ActionResponse;
import com.quokkatoon.level.dto.ExpChangeResponse;
import com.quokkatoon.level.entity.LevelActionType;
import com.quokkatoon.level.service.ExperienceService;
import com.quokkatoon.user.entity.User;
import com.quokkatoon.user.repository.UserRepository;
import com.quokkatoon.webtoon.entity.Webtoon;
import com.quokkatoon.webtoon.repository.WebtoonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final PostReactionRepository postReactionRepository;
    private final CommentReactionRepository commentReactionRepository;
    private final BoardCategoryRepository boardCategoryRepository;
    private final UserRepository userRepository;
    private final WebtoonRepository webtoonRepository;
    private final ExperienceService experienceService;

    // 목록 (board: "all" | "free" | "webtoon"). 최신순, 삭제글 제외.
    @Transactional(readOnly = true)
    public List<PostListItem> getPosts(String board) {
        List<Post> posts = (board == null || board.isBlank() || board.equalsIgnoreCase("all"))
                ? postRepository.findByDeletedFalseOrderByCreatedAtDesc()
                : postRepository.findByCategoryCodeAndDeletedFalseOrderByCreatedAtDesc(board.toUpperCase());
        return posts.stream().map(PostListItem::of).toList();
    }

    // 내가 쓴 글
    @Transactional(readOnly = true)
    public List<PostListItem> getMyPosts(Long userId) {
        return postRepository.findByUserIdAndDeletedFalseOrderByCreatedAtDesc(userId)
                .stream().map(PostListItem::of).toList();
    }

    // 내가 쓴 댓글
    @Transactional(readOnly = true)
    public List<MyCommentItem> getMyComments(Long userId) {
        return commentRepository.findMyComments(userId)
                .stream().map(MyCommentItem::of).toList();
    }

    // 상세 (+조회수 증가)
    @Transactional
    public PostDetailResponse getPost(Long postId, Long currentUserId) {
        Post post = getActivePost(postId);
        post.increaseView();

        List<CommentResponse> comments = commentRepository
                .findByPostIdAndDeletedFalseOrderByCreatedAtAsc(postId).stream()
                .map(c -> CommentResponse.of(c, currentUserId, isCommentLiked(c.getId(), currentUserId)))
                .toList();

        String myReaction = currentUserId == null ? null
                : postReactionRepository.findByPostIdAndUserId(postId, currentUserId)
                    .map(r -> r.getType().name()).orElse(null);

        return PostDetailResponse.of(post, comments, currentUserId, myReaction);
    }

    @Transactional
    public ActionResponse<Long> createPost(Long userId, PostCreateRequest req) {
        User user = getUser(userId);
        String code = req.board().toUpperCase();
        BoardCategory category = boardCategoryRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REQUEST));

        Webtoon webtoon = null;
        if ("WEBTOON".equals(code) && req.webtoonId() != null) {
            webtoon = webtoonRepository.findById(req.webtoonId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.WEBTOON_NOT_FOUND));
        }

        Post post = Post.builder()
                .category(category)
                .user(user)
                .webtoon(webtoon)
                .title(ContentValidator.postTitle(req.title()))
                .content(ContentValidator.postContent(req.content()))
                .rating("WEBTOON".equals(code) ? req.rating() : null)
                .build();
        Post saved = postRepository.saveAndFlush(post);
        ExpChangeResponse exp = experienceService.award(userId, LevelActionType.POST, 4,
                "POST", saved.getId(), userId, "POST_CREATE:" + saved.getId());
        return new ActionResponse<>(saved.getId(), exp);
    }

    @Transactional
    public ActionResponse<Void> deletePost(Long postId, Long userId) {
        Post post = postRepository.findByIdForUpdate(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        if (!post.isAuthor(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
        if (post.isDeleted()) return new ActionResponse<>(null, null);
        post.softDelete();
        ExpChangeResponse exp = experienceService.reverseAllForReference("POST", postId);
        for (Comment comment : commentRepository.findByPostIdOrderByCreatedAtAsc(postId)) {
            if (!comment.isDeleted()) comment.softDelete();
            experienceService.reverseAllForReference("COMMENT", comment.getId());
        }
        return new ActionResponse<>(null, exp);
    }

    @Transactional
    public ActionResponse<CommentResponse> addComment(Long postId, Long userId, CommentCreateRequest req) {
        Post post = getActivePost(postId);
        User user = getUser(userId);
        if (req.parentId() != null) {
            Comment parent = commentRepository.findById(req.parentId())
                    .filter(c -> !c.isDeleted() && c.getPost().getId().equals(postId))
                    .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
            if (parent.getParentId() != null) throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }
        Comment comment = Comment.builder()
                .post(post)
                .user(user)
                .parentId(req.parentId())
                .content(ContentValidator.comment(req.text()))
                .build();
        Comment saved = commentRepository.saveAndFlush(comment);
        post.increaseComment();
        ExpChangeResponse exp = experienceService.award(userId, LevelActionType.COMMENT, 3,
                "COMMENT", saved.getId(), userId, "COMMENT_CREATE:" + saved.getId());
        return new ActionResponse<>(CommentResponse.of(saved, userId, false), exp);
    }

    @Transactional
    public ActionResponse<Void> deleteComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
        if (!comment.isAuthor(userId)) throw new BusinessException(ErrorCode.ACCESS_DENIED);
        if (comment.isDeleted()) return new ActionResponse<>(null, null);
        comment.softDelete();
        comment.getPost().decreaseComment();
        ExpChangeResponse exp = experienceService.reverseAllForReference("COMMENT", commentId);
        return new ActionResponse<>(null, exp);
    }

    // 추천/비추천: 1인 1표, 전환·해제 가능
    @Transactional
    public ActionResponse<PostReactionResponse> reactPost(Long postId, Long userId, String kind) {
        Post post = postRepository.findByIdForUpdate(postId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        ReactionType type = "dislike".equalsIgnoreCase(kind) ? ReactionType.DISLIKE : ReactionType.LIKE;

        var existing = postReactionRepository.findByPostIdAndUserId(postId, userId).orElse(null);
        String myReaction;
        if (existing == null) {
            postReactionRepository.save(PostReaction.builder()
                    .postId(postId).userId(userId).type(type).build());
            applyPostDelta(post, type, +1);
            myReaction = type.name();
            if (type == ReactionType.LIKE && !post.isAuthor(userId)) {
                experienceService.awardRecommendation(post.getUser().getId(), "POST", postId, userId);
            }
        } else if (existing.getType() == type) {
            // 같은 반응 다시 → 취소
            postReactionRepository.delete(existing);
            applyPostDelta(post, type, -1);
            myReaction = null;
            if (type == ReactionType.LIKE && !post.isAuthor(userId)) {
                experienceService.reverseRecommendation(post.getUser().getId(), "POST", postId, userId);
            }
        } else {
            // 반대 반응으로 전환
            applyPostDelta(post, existing.getType(), -1);
            applyPostDelta(post, type, +1);
            existing.changeType(type);
            myReaction = type.name();
            if (!post.isAuthor(userId)) {
                if (type == ReactionType.LIKE) {
                    experienceService.awardRecommendation(post.getUser().getId(), "POST", postId, userId);
                } else {
                    experienceService.reverseRecommendation(post.getUser().getId(), "POST", postId, userId);
                }
            }
        }
        return new ActionResponse<>(
                new PostReactionResponse(post.getLikeCount(), post.getDislikeCount(), myReaction), null);
    }

    // 댓글 좋아요 토글
    @Transactional
    public CommentReactionResponse reactComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));

        var existing = commentReactionRepository.findByCommentIdAndUserId(commentId, userId).orElse(null);
        boolean liked;
        if (existing == null) {
            commentReactionRepository.save(CommentReaction.builder()
                    .commentId(commentId).userId(userId).build());
            comment.changeLikeCount(+1);
            liked = true;
        } else {
            commentReactionRepository.delete(existing);
            comment.changeLikeCount(-1);
            liked = false;
        }
        return new CommentReactionResponse(comment.getLikeCount(), liked);
    }

    private void applyPostDelta(Post post, ReactionType type, int delta) {
        if (type == ReactionType.DISLIKE) post.changeDislikeCount(delta);
        else post.changeLikeCount(delta);
    }

    private boolean isCommentLiked(Long commentId, Long userId) {
        return userId != null
                && commentReactionRepository.findByCommentIdAndUserId(commentId, userId).isPresent();
    }

    private Post getActivePost(Long postId) {
        return postRepository.findById(postId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
