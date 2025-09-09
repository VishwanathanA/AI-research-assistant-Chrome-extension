package com.research.assistant.Service;

import com.research.assistant.Entity.Research;
import com.research.assistant.Repository.ResearchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ResearchService {

    @Autowired
    private ResearchRepository researchRepository;

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
        Optional<Research> research = researchRepository.findById(id);
        if (research.isPresent()) {
            return research.get();
        } else {
            throw new RuntimeException("Research not found with id: " + id);
        }
    }

    public Research updateResearch(Long id, Research newResearch) {
        Research existingResearch = getResearchById(id);
        existingResearch.setTitle(newResearch.getTitle());
        existingResearch.setContent(newResearch.getContent());
        existingResearch.setDate(LocalDate.now());
        return researchRepository.save(existingResearch);
    }

    public void deleteResearch(Long id) {
        if (researchRepository.existsById(id)) {
            researchRepository.deleteById(id);
        } else {
            throw new RuntimeException("Research not found with id: " + id);
        }
    }

    public List<Research> searchResearch(String query) {
        return researchRepository.searchAnywhere(query.trim());
    }

    public List<Research> searchByDateRange(LocalDate start, LocalDate end) {
        return researchRepository.findByDateBetween(start, end);
    }
}