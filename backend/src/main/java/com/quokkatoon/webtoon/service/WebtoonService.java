package com.quokkatoon.webtoon.service;

import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;
import com.quokkatoon.webtoon.dto.WebtoonDetailResponse;
import com.quokkatoon.webtoon.dto.WebtoonListItem;
import com.quokkatoon.webtoon.entity.Webtoon;
import com.quokkatoon.webtoon.repository.WebtoonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WebtoonService {

    private final WebtoonRepository webtoonRepository;

    // 목록 (1d). 정렬은 Pageable 로 받는다: ?sort=viewCount,desc 등
    @Transactional(readOnly = true)
    public Page<WebtoonListItem> list(Pageable pageable) {
        return webtoonRepository.findAll(pageable).map(WebtoonListItem::from);
    }

    // 상세 (1e)
    @Transactional(readOnly = true)
    public WebtoonDetailResponse detail(Long id) {
        Webtoon w = webtoonRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.WEBTOON_NOT_FOUND));
        return WebtoonDetailResponse.from(w);
    }
}
