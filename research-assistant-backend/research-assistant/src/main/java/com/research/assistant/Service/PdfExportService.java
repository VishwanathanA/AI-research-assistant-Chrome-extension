package com.research.assistant.Service;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.research.assistant.Entity.Research;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PdfExportService {

    private static final Font BIG_FONT = new Font(Font.FontFamily.HELVETICA, 16, Font.BOLD);
    private static final Font BOLD_FONT = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD);
    private static final Font SMALL_FONT = new Font(Font.FontFamily.HELVETICA, 10);

    // PDF for single research
    public byte[] makeOnePdf(Research research) throws DocumentException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document();
        PdfWriter.getInstance(doc, out);
        doc.open();

        doc.add(new Paragraph(research.getTitle(), BIG_FONT));
        doc.add(new Paragraph("Created on: " + research.getDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")), SMALL_FONT));
        doc.add(new Paragraph(research.getContent(), SMALL_FONT));
        doc.close();

        return out.toByteArray();
    }

    // PDF for list of research notes
    public byte[] makeListPdf(List<Research> researchList) throws DocumentException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document();
        PdfWriter.getInstance(doc, out);
        doc.open();

        doc.add(new Paragraph("All Research Documents", BIG_FONT));
        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.addCell(new Phrase("Title", BOLD_FONT));
        table.addCell(new Phrase("Content Preview", BOLD_FONT));
        table.addCell(new Phrase("Date", BOLD_FONT));

        for (Research research : researchList) {
            table.addCell(new Phrase(research.getTitle(), SMALL_FONT));
            String preview = (research.getContent() != null && research.getContent().length() > 50)
                    ? research.getContent().substring(0, 50) + "..."
                    : (research.getContent() != null ? research.getContent() : "");
            table.addCell(new Phrase(preview, SMALL_FONT));
            table.addCell(new Phrase(research.getDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")), SMALL_FONT));
        }

        doc.add(table);
        doc.close();
        return out.toByteArray();
    }
}
