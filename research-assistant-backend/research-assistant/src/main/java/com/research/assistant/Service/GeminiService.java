package com.research.assistant.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.research.assistant.GeminiResponse;
import com.research.assistant.ResearchRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;
import java.util.List;
import java.time.Duration;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public GeminiService(WebClient webClient, ObjectMapper objectMapper) {
        this.webClient = webClient;
        this.objectMapper = objectMapper;
    }

    /**
     * Send a prompt to Gemini AI with automatic retries on 503 errors
     */
    public String processContent(ResearchRequest request) {
        try {
            // Build the prompt using the ResearchRequest
            String prompt = buildPrompt(request);

            // Create the request body in the correct Gemini 2.0 Flash format
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of(
                                    "role", "user",
                                    "parts", List.of(
                                            Map.of("text", prompt)
                                    )
                            )
                    ),
                    // Add generation config for better control
                    "generationConfig", Map.of(
                            "temperature", 0.7,
                            "topP", 0.8,
                            "topK", 40,
                            "maxOutputTokens", 1024,
                            "responseMimeType", "text/plain"
                    )
            );

            // Log the actual JSON for debugging
            String jsonBody = objectMapper.writeValueAsString(requestBody);
            System.out.println("Request JSON: " + jsonBody);

            GeminiResponse geminiResponse = webClient.post()
                    .uri(geminiApiUrl + "?key=" + geminiApiKey)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(GeminiResponse.class)
                    .retryWhen(Retry.backoff(3, Duration.ofSeconds(2))
                            .filter(throwable -> throwable instanceof WebClientResponseException
                                    && ((WebClientResponseException) throwable).getStatusCode().value() == 503))
                    .onErrorResume(WebClientResponseException.class, ex -> {
                        // Log the actual error response from Gemini
                        System.err.println("Gemini API Error: " + ex.getStatusCode() + " - " + ex.getResponseBodyAsString());
                        return Mono.empty(); // Return empty to trigger fallback
                    })
                    .block();

            if (geminiResponse == null) {
                throw new RuntimeException("Failed to get response from Gemini API");
            }

            // Log response
            System.out.println("Received response from Gemini: " + geminiResponse);

            return extractText(geminiResponse);

        } catch (Exception e) {
            System.err.println("AI Service error: " + e.getMessage());
            e.printStackTrace();
            return "AI service temporarily unavailable. Please try again later.";
        }
    }

    /**
     * Extract text from GeminiResponse safely
     */
    private String extractText(GeminiResponse geminiResponse) {
        if (geminiResponse == null || geminiResponse.getCandidates() == null || geminiResponse.getCandidates().isEmpty()) {
            return "No candidates found in response";
        }

        var firstCandidate = geminiResponse.getCandidates().get(0);
        if (firstCandidate.getContent() != null &&
                firstCandidate.getContent().getParts() != null &&
                !firstCandidate.getContent().getParts().isEmpty()) {
            return firstCandidate.getContent().getParts().get(0).getText();
        }

        return "No content found in response";
    }

    /**
     * Build a context-aware prompt for Gemini AI
     */
    private String buildPrompt(ResearchRequest request) {
        StringBuilder prompt = new StringBuilder();
        String context = request.getContext();
        String content = request.getContent();

        switch (request.getOperation()) {
            case "summarize":
                if (context != null && !context.isEmpty()) {
                    prompt.append("Summarize this text for the field of ").append(context)
                            .append(" in a few concise lines. Highlight important words using <b>bold</b> tags:\n\n");
                } else {
                    prompt.append("Summarize this text in a few concise lines. Highlight important words using <b>bold</b> tags:\n\n");
                }
                prompt.append(content);
                break;

            case "suggest":
                if (context == null || context.isEmpty()) context = "general";
                prompt.append("You are an expert in ").append(context)
                        .append(". Provide a list of topics or notes relevant to this field, highlighting important words using <b>bold</b> tags, one per line:\n\n");
                prompt.append(content);
                break;

            default:
                prompt.append(content);
                break;
        }

        return prompt.toString();
    }
}