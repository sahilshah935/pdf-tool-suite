import sys
import io
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

try:
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    text = sys.argv[3]

    # Create watermark
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)
    can.setFont("Helvetica-Bold", 50)
    can.setFillColorRGB(0.5, 0.5, 0.5, 0.5)
    
    # Draw centered
    can.saveState()
    can.translate(300, 500)
    can.rotate(45)
    can.drawCentredString(0, 0, text)
    can.restoreState()
    can.save()
    packet.seek(0)

    # Merge
    watermark_pdf = PdfReader(packet)
    watermark_page = watermark_pdf.pages[0]
    reader = PdfReader(input_path)
    writer = PdfWriter()

    for page in reader.pages:
        page.merge_page(watermark_page)
        writer.add_page(page)

    writer.write(output_path)
    print("SUCCESS")

except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)