package com.research.assistant.Service;

import com.research.assistant.Entity.Research;
import com.research.assistant.Repository.ResearchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ResearchService {

    private final ResearchRepository researchRepository;

    public Research createResearch(Research research) {
        if (research.getDate() == null) {
            research.setDate(LocalDate.now());
        }
        return researchRepository.save(research);
    }

    public List<Research> getAllResearch() {
        return researchRepository.findAll();
    }

    public Research getResearchById(Long id) {
        return researchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Research not found with id: " + id));
    }

    public Research updateResearch(Long id, Research newResearch) {
        Research existingResearch = getResearchById(id);
        existingResearch.setTitle(newResearch.getTitle());
        existingResearch.setContent(newResearch.getContent());
        existingResearch.setDate(LocalDate.now());
        return researchRepository.save(existingResearch);
    }

    public void deleteResearch(Long id) {
        if (!researchRepository.existsById(id)) {
            throw new RuntimeException("Research not found with id: " + id);
        }
        researchRepository.deleteById(id);
    }

    public List<Research> searchResearch(String query) {
        return researchRepository.searchAnywhere(query.trim());
    }

    public List<Research> searchByDateRange(LocalDate start, LocalDate end) {
        if (start.isAfter(end)) {
            throw new RuntimeException("Start date cannot be after end date");
        }
        return researchRepository.findByDateBetween(start, end);
    }
}