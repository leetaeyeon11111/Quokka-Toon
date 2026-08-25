package com.quokkatoon.prompt.repository;

import com.quokkatoon.prompt.entity.QuickPrompt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuickPromptRepository extends JpaRepository<QuickPrompt, Long> {

    // 노출 순서: sortOrder 오름차순, 동일하면 id 오름차순
    List<QuickPrompt> findAllByOrderBySortOrderAscIdAsc();
}
