package com.quokkatoon.webtoon.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "webtoon_view_event", uniqueConstraints =
        @UniqueConstraint(name = "uq_webtoon_viewer_day",
                columnNames = {"webtoon_id", "viewer_key", "view_date"}))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WebtoonViewEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "view_event_id")
    private Long id;

    @Column(name = "webtoon_id", nullable = false)
    private Long webtoonId;

    @Column(name = "viewer_key", nullable = false, length = 64)
    private String viewerKey;

    @Column(name = "view_date", nullable = false)
    private LocalDate viewDate;

    @Column(name = "viewed_at", nullable = false)
    private LocalDateTime viewedAt;
}
