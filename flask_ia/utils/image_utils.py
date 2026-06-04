"""Utilitaires image : décodage base64, validation."""
import base64, os
from datetime import datetime

def decode_base64_image(b64: str, output_dir: str, prefix="img") -> str | None:
    try:
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        missing = len(b64) % 4
        if missing:
            b64 += "=" * (4 - missing)
        data = base64.b64decode(b64)
        ext  = "jpg" if data[:2] == b"\xff\xd8" else "png"
        os.makedirs(output_dir, exist_ok=True)
        path = os.path.join(output_dir, f"{prefix}_{datetime.now().timestamp():.0f}.{ext}")
        with open(path, "wb") as f:
            f.write(data)
        return path
    except Exception:
        return None
