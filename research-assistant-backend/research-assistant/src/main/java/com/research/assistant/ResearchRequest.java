package com.research.assistant;

import lombok.Data;

@Data
public class ResearchRequest {
    private String content;        // Selected text from Chrome extension
    private String operation;      // "summarize" or "suggest"
    private String context;        // Optional extra instructions
    private boolean saveToDatabase = true; // Auto-save flag
}
