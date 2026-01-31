import sys
import pikepdf

def compress_pdf(input_path, output_path):
    try:
        # Open PDF
        pdf = pikepdf.Pdf.open(input_path)
        
        # 1. Remove metadata (Author, Creator, etc.) to save space
        del pdf.docinfo

        # 2. Remove unreferenced resources (cleaning up garbage data)
        pdf.remove_unreferenced_resources()

        # 3. Save with aggressive settings
        # compress_streams=True: Re-compresses content streams
        # object_stream_mode=generate: Groups objects to save space
        pdf.save(
            output_path, 
            compress_streams=True, 
            object_stream_mode=pikepdf.ObjectStreamMode.generate
        )
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    compress_pdf(sys.argv[1], sys.argv[2])