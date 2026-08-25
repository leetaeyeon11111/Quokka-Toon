package com.quokkatoon.webtoon.service;

import com.quokkatoon.global.exception.BusinessException;
import com.quokkatoon.global.exception.ErrorCode;
import com.quokkatoon.webtoon.dto.AuthorItem;
import com.quokkatoon.webtoon.dto.WebtoonDetailResponse;
import com.quokkatoon.webtoon.dto.WebtoonListItem;
import com.quokkatoon.webtoon.entity.Webtoon;
import com.quokkatoon.webtoon.repository.WebtoonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WebtoonService {

    private final WebtoonRepository webtoonRepository;

    // 목록: 제목/플랫폼/장르/작가 필터 (빈 문자열은 null 로 처리해 필터 해제).
    @Transactional(readOnly = true)
    public Page<WebtoonListItem> search(String q, String platform, String genre,
                                        String author, Pageable pageable) {
        return webtoonRepository
                .search(blankToNull(q), blankToNull(platform), blankToNull(genre),
                        blankToNull(author), pageable)
                .map(WebtoonListItem::from);
    }

    // 상세: 기본정보 + 연결 테이블(작가/장르/태그) 조인
    @Transactional(readOnly = true)
    public WebtoonDetailResponse detail(Long id) {
        Webtoon w = webtoonRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.WEBTOON_NOT_FOUND));

        List<AuthorItem> authors = webtoonRepository.findAuthors(id).stream()
                .map(row -> new AuthorItem((String) row[0], (String) row[1]))
                .toList();
        List<String> genres = webtoonRepository.findGenreNames(id);
        List<String> tags = webtoonRepository.findTagNames(id);

        return WebtoonDetailResponse.from(w, authors, genres, tags);
    }

    @Transactional(readOnly = true)
    public List<String> genreNames() {
        return webtoonRepository.findAllGenreNames();
    }

    @Transactional(readOnly = true)
    public List<String> platformNames() {
        return webtoonRepository.findAllPlatformNames();
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
