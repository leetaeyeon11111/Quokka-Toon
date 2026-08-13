package com.quokkatoon.board;

import com.quokkatoon.board.entity.BoardCategory;
import com.quokkatoon.board.repository.BoardCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// board_category 에 FREE / WEBTOON 기본 행이 없으면 기동 시 한 번 채워둔다.
@Configuration
@RequiredArgsConstructor
public class BoardCategoryInitializer {

    @Bean
    public ApplicationRunner seedBoardCategories(BoardCategoryRepository repository) {
        return args -> {
            if (!repository.existsByCode("FREE")) {
                repository.save(BoardCategory.builder().code("FREE").name("자유게시판").sortOrder(1).build());
            }
            if (!repository.existsByCode("WEBTOON")) {
                repository.save(BoardCategory.builder().code("WEBTOON").name("웹툰게시판").sortOrder(2).build());
            }
        };
    }
}
