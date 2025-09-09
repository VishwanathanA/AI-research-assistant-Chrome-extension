package com.research.assistant.Service;

import com.research.assistant.ResearchRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import java.util.HashMap;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public String processContent(ResearchRequest request) {
        try {
            String prompt = buildPrompt(request);

            Map<String, Object> requestBody = new HashMap<>();

            Map<String, Object> content = new HashMap<>();
            content.put("role", "user");

            Map<String, String> part = new HashMap<>();
            part.put("text", prompt);

            content.put("parts", new Object[]{part});
            requestBody.put("contents", new Object[]{content});

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String url = geminiApiUrl + "?key=" + geminiApiKey;
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // Make the actual API call
            Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);

            // Extract the response text from the complex JSON structure
            if (response != null && response.containsKey("candidates")) {
                Object candidates = response.get("candidates");
                if (candidates instanceof java.util.List && !((java.util.List<?>) candidates).isEmpty()) {
                    Object firstCandidate = ((java.util.List<?>) candidates).get(0);
                    if (firstCandidate instanceof java.util.Map) {
                        java.util.Map<?, ?> candidateMap = (java.util.Map<?, ?>) firstCandidate;
                        Object contentObj = candidateMap.get("content");
                        if (contentObj instanceof java.util.Map) {
                            java.util.Map<?, ?> contentMap = (java.util.Map<?, ?>) contentObj;
                            Object partsObj = contentMap.get("parts");
                            if (partsObj instanceof java.util.List && !((java.util.List<?>) partsObj).isEmpty()) {
                                Object firstPart = ((java.util.List<?>) partsObj).get(0);
                                if (firstPart instanceof java.util.Map) {
                                    java.util.Map<?, ?> partMap = (java.util.Map<?, ?>) firstPart;
                                    Object textObj = partMap.get("text");
                                    if (textObj != null) {
                                        return textObj.toString();
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // If we can't extract the response, return a simple summary
            return createSimpleSummary(request.getContent());

        } catch (Exception e) {
            System.out.println("AI Service error: " + e.getMessage());
            // Return a simple summary instead of error message
            return createSimpleSummary(request.getContent());
        }
    }

    // Create a simple summary when AI service is unavailable
    private String createSimpleSummary(String content) {
        if (content == null || content.trim().isEmpty()) {
            return "No content to summarize.";
        }

        // Split into sentences and take first 2-3 sentences
        String[] sentences = content.split("\\.\\s+");
        StringBuilder summary = new StringBuilder();

        int sentencesToTake = Math.min(3, sentences.length);
        for (int i = 0; i < sentencesToTake; i++) {
            if (i > 0) summary.append(" ");
            summary.append(sentences[i]).append(".");
        }

        // Add bold tags to important words (simple heuristic)
        String result = summary.toString();
        result = result.replace("important", "<b>important</b>")
                .replace("key", "<b>key</b>")
                .replace("essential", "<b>essential</b>")
                .replace("critical", "<b>critical</b>")
                .replace("major", "<b>major</b>")
                .replace("significant", "<b>significant</b>");

        return result;
    }

    private String buildPrompt(ResearchRequest request) {
        StringBuilder prompt = new StringBuilder();

        if ("summarize".equals(request.getOperation())) {
            if (request.getContext() != null && !request.getContext().isEmpty()) {
                prompt.append("Summarize this text about ")
                        .append(request.getContext())
                        .append(" in a few concise lines. Highlight important words using <b>bold</b> tags:\n\n");
            } else {
                prompt.append("Summarize this text in a few concise lines. Highlight important words using <b>bold</b> tags:\n\n");
            }
        } else if ("suggest".equals(request.getOperation())) {
            String context = request.getContext();
            if (context == null || context.isEmpty()) {
                context = "general";
            }
            prompt.append("You are an expert in ")
                    .append(context)
                    .append(". Provide a list of topics or notes relevant to this field, highlighting important words using <b>bold</b> tags, one per line:\n\n");
        } else {
            prompt.append("Please process this text:\n\n");
        }

        prompt.append(request.getContent());
        return prompt.toString();
    }
}