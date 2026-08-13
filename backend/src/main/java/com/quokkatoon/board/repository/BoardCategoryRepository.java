package com.quokkatoon.board.repository;

import com.quokkatoon.board.entity.BoardCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BoardCategoryRepository extends JpaRepository<BoardCategory, Long> {
    Optional<BoardCategory> findByCode(String code);
    boolean existsByCode(String code);
}
