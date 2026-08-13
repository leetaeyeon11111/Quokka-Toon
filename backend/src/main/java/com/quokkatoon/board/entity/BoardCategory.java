package com.quokkatoon.board.entity;

import com.quokkatoon.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// board_category: 게시판 종류 마스터 (code = FREE / WEBTOON)
@Getter
@Entity
@Table(name = "board_category")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BoardCategory extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Long id;

    @Column(nullable = false, length = 20, unique = true)
    private String code;   // FREE | WEBTOON

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Builder
    private BoardCategory(String code, String name, int sortOrder) {
        this.code = code;
        this.name = name;
        this.sortOrder = sortOrder;
    }

    public String codeLower() {
        return code.toLowerCase();
    }
}
