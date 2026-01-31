import sys
from pypdf import PdfWriter

try:
    merger = PdfWriter()
    # Output is argv[1], Inputs are argv[2:]
    output_path = sys.argv[1]
    input_paths = sys.argv[2:]

    for pdf in input_paths:
        merger.append(pdf)

    merger.write(output_path)
    merger.close()
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)