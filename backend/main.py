from src.pipeline import PhotoRestorer

if __name__ == "__main__":
    restorer = PhotoRestorer()
    restorer.restore(
        image_path="test.jpeg",
        use_face_restore=True,
        output_path="hasil_restorasi.jpg"
    )