package com.quokkatoon.report.repository;

import com.quokkatoon.report.entity.Report;
import com.quokkatoon.report.entity.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status);

    List<Report> findByStatusInOrderByCreatedAtDesc(Collection<ReportStatus> statuses);

    List<Report> findAllByOrderByCreatedAtDesc();
}
