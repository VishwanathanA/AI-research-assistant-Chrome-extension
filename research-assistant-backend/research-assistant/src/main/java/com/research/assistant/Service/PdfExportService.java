package com.research.assistant.Service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfWriter;
import com.research.assistant.Entity.Research;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class PdfExportService {

    public byte[] makeOnePdf(Research research) throws DocumentException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, out);

        document.open();

        // Add title
        Font titleFont = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD);
        Paragraph title = new Paragraph(research.getTitle(), titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        // Add date
        Font dateFont = new Font(Font.FontFamily.HELVETICA, 12, Font.ITALIC);
        String dateStr = "Date: " + research.getDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        Paragraph date = new Paragraph(dateStr, dateFont);
        date.setAlignment(Element.ALIGN_CENTER);
        document.add(date);

        // Add some space
        document.add(new Paragraph(" "));

        // Add content
        Font contentFont = new Font(Font.FontFamily.HELVETICA, 12);
        Paragraph content = new Paragraph(research.getContent(), contentFont);
        document.add(content);

        document.close();
        return out.toByteArray();
    }
}