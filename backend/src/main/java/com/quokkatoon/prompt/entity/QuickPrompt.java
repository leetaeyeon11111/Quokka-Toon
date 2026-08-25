package com.quokkatoon.prompt.entity;

import com.quokkatoon.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// quick_prompt: 메인페이지 추천 검색어 버튼 (관리자가 편집).
//   label = 버튼에 보이는 글씨, query = 클릭 시 실행되는 검색어.
@Getter
@Entity
@Table(name = "quick_prompt")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuickPrompt extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "quick_prompt_id")
    private Long id;

    @Column(nullable = false, length = 50)
    private String label;

    // query 는 SQL 예약어라 컬럼명은 query_text 로 둔다.
    @Column(name = "query_text", nullable = false, length = 200)
    private String query;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Builder
    private QuickPrompt(String label, String query, int sortOrder) {
        this.label = label;
        this.query = query;
        this.sortOrder = sortOrder;
    }

    public void update(String label, String query, int sortOrder) {
        this.label = label;
        this.query = query;
        this.sortOrder = sortOrder;
    }
}
