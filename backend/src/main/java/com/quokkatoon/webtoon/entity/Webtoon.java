package com.quokkatoon.webtoon.entity;

import com.quokkatoon.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Entity
@Table(name = "webtoon")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Webtoon extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "webtoon_id")
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "platform_id")
    private Platform platform;

    @Column(name = "external_url", nullable = false, length = 500)
    private String externalUrl;

    @Column(name = "thumbnail_url", nullable = false, length = 500)
    private String thumbnailUrl;

    @Column(name = "illustration_url", length = 500)
    private String illustrationUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "main_genre_id")
    private Genre mainGenre;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @Column(name = "age_rating", nullable = false, columnDefinition = "ENUM('ALL','12','15','19')")
    private String ageRating = "ALL";

    @Column(name = "episode_count", nullable = false)
    private int episodeCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "publish_day", columnDefinition = "ENUM('MON','TUE','WED','THU','FRI','SAT','SUN')")
    private PublishDay publishDay;

    @Enumerated(EnumType.STRING)
    @Column(name = "serial_status", nullable = false,
            columnDefinition = "ENUM('ONGOING','COMPLETED','HIATUS')")
    private SerialStatus serialStatus = SerialStatus.ONGOING;

    @Column(name = "view_count", nullable = false)
    private long viewCount = 0;

    @Column(name = "bookmark_count", nullable = false)
    private int bookmarkCount = 0;

    @Column(name = "rating_avg", nullable = false, precision = 3, scale = 2)
    private BigDecimal ratingAvg = BigDecimal.ZERO;

    @Column(name = "rating_count", nullable = false)
    private int ratingCount = 0;

    @Column(name = "released_at")
    private LocalDate releasedAt;
}
