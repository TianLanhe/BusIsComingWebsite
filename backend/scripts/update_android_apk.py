#!/usr/bin/env python3

import hashlib
import json
import re
import shutil
import subprocess
import sys
from datetime import date
from pathlib import Path

if len(sys.argv) != 2:
    raise SystemExit("Usage: backend/scripts/update_android_apk.py <apk-file-path>")

source = Path(sys.argv[1]).expanduser().resolve()
if not source.is_file():
    raise SystemExit(f"APK file not found: {source}")

root = Path(__file__).resolve().parents[1]
target_name = "BusIsComing.apk"
target_apk = root / "downloads/android" / target_name
current_json = root / "downloads/android/current.json"

try:
    badging = subprocess.check_output(["aapt", "dump", "badging", str(source)], text=True)
except FileNotFoundError:
    raise SystemExit("aapt not found. Install Android SDK build-tools and ensure aapt is in PATH.")

package = next((line for line in badging.splitlines() if line.startswith("package:")), "")


def pick(pattern: str, label: str) -> str:
    match = re.search(pattern, package)
    if not match:
        raise SystemExit(f"Cannot parse {label} from APK metadata")
    return match.group(1)


size_bytes = source.stat().st_size
size_mb = f"{size_bytes / 1024 / 1024:.1f} MB"
app_label = re.search(r"^application-label:'([^']+)'", badging, re.MULTILINE)

target_apk.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(source, target_apk)

metadata = {
    "platform": "android",
    "appName": app_label.group(1) if app_label else "BusIsComing",
    "applicationId": pick(r"name='([^']+)'", "applicationId"),
    "versionName": pick(r"versionName='([^']+)'", "versionName"),
    "versionCode": int(pick(r"versionCode='([^']+)'", "versionCode")),
    "fileName": target_name,
    "relativePath": target_name,
    "sourcePath": str(source),
    "sizeBytes": size_bytes,
    "sizeLabel": {"zh-Hant": f"約 {size_mb}", "zh-Hans": f"约 {size_mb}", "en": f"About {size_mb}"},
    "sha256": hashlib.sha256(target_apk.read_bytes()).hexdigest(),
    "lastUpdated": date.today().isoformat(),
    "status": "available",
}

current_json.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")

print(f"Updated {target_apk}")
print(f"Updated {current_json}")
print(f"versionName={metadata['versionName']} versionCode={metadata['versionCode']}")
print(f"sizeBytes={metadata['sizeBytes']}")
print(f"sha256={metadata['sha256']}")
