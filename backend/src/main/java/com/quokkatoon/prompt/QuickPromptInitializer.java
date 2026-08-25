package com.quokkatoon.prompt;

import com.quokkatoon.prompt.entity.QuickPrompt;
import com.quokkatoon.prompt.repository.QuickPromptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// quick_prompt 가 비어 있으면 기동 시 메인페이지 기본 추천 검색어 4개를 채워둔다.
@Configuration
@RequiredArgsConstructor
public class QuickPromptInitializer {

    @Bean
    public ApplicationRunner seedQuickPrompts(QuickPromptRepository repository) {
        return args -> {
            if (repository.count() > 0) return;
            repository.save(QuickPrompt.builder()
                    .label("비 오는 날 힐링").query("비 오는 날 편안하게 읽기 좋은 힐링 웹툰").sortOrder(1).build());
            repository.save(QuickPrompt.builder()
                    .label("설레는 로맨스").query("서로 천천히 가까워지는 설레는 로맨스 웹툰").sortOrder(2).build());
            repository.save(QuickPrompt.builder()
                    .label("빌런 참교육").query("빌런을 시원하게 참교육하는 사이다 복수극").sortOrder(3).build());
            repository.save(QuickPrompt.builder()
                    .label("밤새 볼 두뇌싸움").query("반전과 두뇌싸움이 짜릿한 몰입도 높은 웹툰").sortOrder(4).build());
        };
    }
}
