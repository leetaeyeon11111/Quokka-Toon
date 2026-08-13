package com.quokkatoon.board.service;

import com.quokkatoon.board.dto.*;
import com.quokkatoon.board.entity.*;
import com.quokkatoon.board.repository.*;
import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;
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
    public Long createPost(Long userId, PostCreateRequest req) {
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
                .title(req.title())
                .content(req.content())
                .rating("WEBTOON".equals(code) ? req.rating() : null)
                .build();
        return postRepository.save(post).getId();
    }

    @Transactional
    public void deletePost(Long postId, Long userId) {
        Post post = getActivePost(postId);
        if (!post.isAuthor(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }
        post.softDelete();
    }

    @Transactional
    public CommentResponse addComment(Long postId, Long userId, CommentCreateRequest req) {
        Post post = getActivePost(postId);
        User user = getUser(userId);
        Comment comment = Comment.builder()
                .post(post)
                .user(user)
                .parentId(req.parentId())
                .content(req.text())
                .build();
        Comment saved = commentRepository.save(comment);
        post.increaseComment();
        return CommentResponse.of(saved, userId, false);
    }

    // 추천/비추천: 1인 1표, 전환·해제 가능
    @Transactional
    public PostReactionResponse reactPost(Long postId, Long userId, String kind) {
        Post post = getActivePost(postId);
        ReactionType type = "dislike".equalsIgnoreCase(kind) ? ReactionType.DISLIKE : ReactionType.LIKE;

        var existing = postReactionRepository.findByPostIdAndUserId(postId, userId).orElse(null);
        String myReaction;
        if (existing == null) {
            postReactionRepository.save(PostReaction.builder()
                    .postId(postId).userId(userId).type(type).build());
            applyPostDelta(post, type, +1);
            myReaction = type.name();
        } else if (existing.getType() == type) {
            // 같은 반응 다시 → 취소
            postReactionRepository.delete(existing);
            applyPostDelta(post, type, -1);
            myReaction = null;
        } else {
            // 반대 반응으로 전환
            applyPostDelta(post, existing.getType(), -1);
            applyPostDelta(post, type, +1);
            existing.changeType(type);
            myReaction = type.name();
        }
        return new PostReactionResponse(post.getLikeCount(), post.getDislikeCount(), myReaction);
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
