package com.quokkatoon.inquiry.repository;

import com.quokkatoon.inquiry.entity.InquiryAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InquiryAnswerRepository extends JpaRepository<InquiryAnswer, Long> {
    Optional<InquiryAnswer> findByInquiryId(Long inquiryId);
    List<InquiryAnswer> findByInquiryIdIn(List<Long> inquiryIds);
    void deleteByInquiryId(Long inquiryId);
}
