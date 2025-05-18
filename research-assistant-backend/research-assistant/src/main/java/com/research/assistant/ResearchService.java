package com.research.assistant;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class ResearchService {
    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.keys}")
    private String[] apiKeys;

    private final AtomicInteger currentKeyIndex = new AtomicInteger(0);
    private final AtomicLong lastRequestTime = new AtomicLong(0);
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public ResearchService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.baseUrl("https://generativelanguage.googleapis.com").build();
        this.objectMapper = objectMapper;
    }

    public String processContent(ResearchRequest request) {
        enforceRateLimit();

        for (int i = 0; i < apiKeys.length; i++) {
            try {
                String currentKey = getNextApiKey();
                String response = makeApiRequest(request, currentKey);
                return extractTextFromResponse(response);
            } catch (WebClientResponseException.TooManyRequests e) {
                if (i == apiKeys.length - 1) {
                    throw new RuntimeException("All API keys rate limited. Please try again later.");
                }
                // Try next key
            } catch (Exception e) {
                throw new RuntimeException("API request failed: " + e.getMessage());
            }
        }
        throw new RuntimeException("Failed to process request");
    }

    private String makeApiRequest(ResearchRequest request, String apiKey) {
        String prompt = buildPrompt(request);

        Map<String, Object> requestBody = Map.of(
                "contents", new Object[] {
                        Map.of("parts", new Object[]{
                                Map.of("text", prompt)
                        })
                }
        );

        return webClient.post()
                .uri(geminiApiUrl + apiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

    private void enforceRateLimit() {
        long now = System.currentTimeMillis();
        long lastTime = lastRequestTime.get();
        long elapsed = now - lastTime;

        if (elapsed < 1000) { // 1 request per second
            try {
                Thread.sleep(1000 - elapsed);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        lastRequestTime.set(System.currentTimeMillis());
    }

    private String getNextApiKey() {
        return apiKeys[currentKeyIndex.getAndUpdate(i -> (i + 1) % apiKeys.length)];
    }

    private String extractTextFromResponse(String response) {
        try {
            GeminiResponse geminiResponse = objectMapper.readValue(response, GeminiResponse.class);
            if (geminiResponse.getCandidates() != null && !geminiResponse.getCandidates().isEmpty()) {
                GeminiResponse.Candidate firstCandidate = geminiResponse.getCandidates().get(0);
                if (firstCandidate.getContent() != null &&
                        firstCandidate.getContent().getParts() != null &&
                        !firstCandidate.getContent().getParts().isEmpty()) {
                    return firstCandidate.getContent().getParts().get(0).getText();
                }
            }
            return "No content found in response";
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse API response: " + e.getMessage());
        }
    }

    private String buildPrompt(ResearchRequest request) {
        StringBuilder prompt = new StringBuilder();
        switch (request.getOperation()) {
            case "summarize":
                prompt.append("Provide a clear and concise summary of the following text in a few sentences:\n\n");
                break;
            case "suggest":
                prompt.append("Based on the following content: suggest related topics and further reading. Format the response with clear headings and bullet points:\n\n");
                break;
            default:
                throw new IllegalArgumentException("Unknown Operation: " + request.getOperation());
        }
        prompt.append(request.getContent());
        return prompt.toString();
    }
}