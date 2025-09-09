package com.research.assistant.Entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
public class Research {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;          // Title of research note
    @Column(columnDefinition = "TEXT")
    private String content;        // Full content / summarized text
    private LocalDate date;        // Creation or update date
}
