package com.quokkatoon.prompt.service;

import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;
import com.quokkatoon.prompt.dto.QuickPromptRequest;
import com.quokkatoon.prompt.dto.QuickPromptResponse;
import com.quokkatoon.prompt.entity.QuickPrompt;
import com.quokkatoon.prompt.repository.QuickPromptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuickPromptService {

    private final QuickPromptRepository quickPromptRepository;

    // 공개 목록 (메인페이지 버튼)
    @Transactional(readOnly = true)
    public List<QuickPromptResponse> list() {
        return quickPromptRepository.findAllByOrderBySortOrderAscIdAsc().stream()
                .map(QuickPromptResponse::from)
                .toList();
    }

    @Transactional
    public QuickPromptResponse create(QuickPromptRequest req) {
        QuickPrompt saved = quickPromptRepository.save(QuickPrompt.builder()
                .label(req.label().trim())
                .query(req.query().trim())
                .sortOrder(req.sortOrder())
                .build());
        return QuickPromptResponse.from(saved);
    }

    @Transactional
    public QuickPromptResponse update(Long id, QuickPromptRequest req) {
        QuickPrompt prompt = quickPromptRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUICK_PROMPT_NOT_FOUND));
        prompt.update(req.label().trim(), req.query().trim(), req.sortOrder());
        return QuickPromptResponse.from(prompt);
    }

    @Transactional
    public void delete(Long id) {
        if (!quickPromptRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.QUICK_PROMPT_NOT_FOUND);
        }
        quickPromptRepository.deleteById(id);
    }
}
