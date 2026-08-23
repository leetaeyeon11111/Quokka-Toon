package com.quokkatoon.board.service;

import com.quokkatoon.board.entity.Comment;
import com.quokkatoon.board.entity.Post;
import com.quokkatoon.board.entity.PostReaction;
import com.quokkatoon.board.entity.ReactionType;
import com.quokkatoon.board.repository.*;
import com.quokkatoon.level.service.ExperienceService;
import com.quokkatoon.user.entity.User;
import com.quokkatoon.user.repository.UserRepository;
import com.quokkatoon.webtoon.repository.WebtoonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class BoardServiceReactionTest {
    private PostRepository posts;
    private CommentRepository comments;
    private PostReactionRepository postReactions;
    private CommentReactionRepository commentReactions;
    private ExperienceService experience;
    private BoardService service;

    @BeforeEach
    void setUp() {
        posts = mock(PostRepository.class);
        comments = mock(CommentRepository.class);
        postReactions = mock(PostReactionRepository.class);
        commentReactions = mock(CommentReactionRepository.class);
        experience = mock(ExperienceService.class);
        service = new BoardService(posts, comments, postReactions, commentReactions,
                mock(BoardCategoryRepository.class), mock(UserRepository.class),
                mock(WebtoonRepository.class), experience);
    }

    @Test
    void selfRecommendationNeverAwardsExperience() {
        User author = user(1L, "author");
        Post post = Post.builder().user(author).title("title").content("content").build();
        ReflectionTestUtils.setField(post, "id", 10L);
        when(posts.findByIdForUpdate(10L)).thenReturn(Optional.of(post));
        when(postReactions.findByPostIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

        var result = service.reactPost(10L, 1L, "like").result();

        assertThat(result.likes()).isEqualTo(1);
        verifyNoInteractions(experience);
    }

    @Test
    void commentRecommendationNeverAwardsExperience() {
        User author = user(1L, "author");
        Post post = Post.builder().user(author).title("title").content("content").build();
        Comment comment = Comment.builder().post(post).user(author).content("valid comment").build();
        ReflectionTestUtils.setField(comment, "id", 22L);
        when(comments.findById(22L)).thenReturn(Optional.of(comment));
        when(commentReactions.findByCommentIdAndUserId(22L, 2L)).thenReturn(Optional.empty());

        assertThat(service.reactComment(22L, 2L).likes()).isEqualTo(1);
        verifyNoInteractions(experience);
    }

    @Test
    void anotherUsersPostLikeAwardsAndCancellationReversesExperience() {
        User author = user(1L, "author");
        Post post = Post.builder().user(author).title("title").content("content").build();
        ReflectionTestUtils.setField(post, "id", 10L);
        PostReaction existing = PostReaction.builder()
                .postId(10L).userId(2L).type(ReactionType.LIKE).build();
        when(posts.findByIdForUpdate(10L)).thenReturn(Optional.of(post));
        when(postReactions.findByPostIdAndUserId(10L, 2L))
                .thenReturn(Optional.empty(), Optional.of(existing));

        assertThat(service.reactPost(10L, 2L, "like").result().likes()).isEqualTo(1);
        assertThat(service.reactPost(10L, 2L, "like").result().likes()).isZero();

        verify(experience).awardRecommendation(1L, "POST", 10L, 2L);
        verify(experience).reverseRecommendation(1L, "POST", 10L, 2L);
    }

    private User user(Long id, String nickname) {
        User user = User.builder().email(nickname + "@test.com").passwordHash("x").nickname(nickname).build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
