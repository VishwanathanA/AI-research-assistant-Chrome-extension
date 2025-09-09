package com.research.assistant.Controller;

import com.research.assistant.Entity.Research;
import com.research.assistant.ResearchRequest;
import com.research.assistant.Service.PdfExportService;
import com.research.assistant.Service.ResearchService;
import com.research.assistant.Service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/research")
@CrossOrigin(origins = "*") // Simple CORS solution
@RequiredArgsConstructor
public class ResearchController {

    private final ResearchService researchService;
    private final PdfExportService pdfExportService;
    private final GeminiService geminiService;

    // AI Processing
    @PostMapping("/process")
    public String processContent(@RequestBody ResearchRequest request) {
        return geminiService.processContent(request);
    }

    // CRUD Operations
    @PostMapping
    public Research createResearch(@RequestBody Research research) {
        return researchService.createResearch(research);
    }

    @GetMapping
    public List<Research> getAllResearch() {
        return researchService.getAllResearch();
    }

    @GetMapping("/{id}")
    public Research getResearchById(@PathVariable Long id) {
        return researchService.getResearchById(id);
    }

    @PutMapping("/{id}")
    public Research updateResearch(@PathVariable Long id, @RequestBody Research research) {
        return researchService.updateResearch(id, research);
    }

    @DeleteMapping("/{id}")
    public String deleteResearch(@PathVariable Long id) {
        researchService.deleteResearch(id);
        return "Research deleted successfully";
    }

    // Search
    @GetMapping("/search")
    public List<Research> searchResearch(@RequestParam String query) {
        return researchService.searchResearch(query);
    }

    @GetMapping("/search/date")
    public List<Research> searchByDateRange(@RequestParam LocalDate startDate,
                                            @RequestParam LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start date cannot be after end date");
        }
        return researchService.searchByDateRange(startDate, endDate);
    }


    // PDF Export
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> exportResearchPdf(@PathVariable Long id) {
        try {
            Research research = researchService.getResearchById(id);
            byte[] pdfBytes = pdfExportService.makeOnePdf(research);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.attachment()
                    .filename(research.getTitle() + ".pdf").build());

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}