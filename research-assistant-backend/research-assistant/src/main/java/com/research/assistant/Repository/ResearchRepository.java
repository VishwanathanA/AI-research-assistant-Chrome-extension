package com.research.assistant.Repository;

import com.research.assistant.Entity.Research;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ResearchRepository extends JpaRepository<Research, Long> {
    List<Research> findByTitleContainingIgnoreCase(String title);
    List<Research> findByContentContainingIgnoreCase(String content);
    List<Research> findByDateBetween(LocalDate start, LocalDate end);

    @Query("SELECT r FROM Research r WHERE LOWER(r.title) LIKE LOWER(CONCAT('%', :word, '%')) OR LOWER(r.content) LIKE LOWER(CONCAT('%', :word, '%'))")
    List<Research> searchAnywhere(@Param("word") String word);
}