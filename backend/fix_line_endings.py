import os

file_path = 'startup.sh'

with open(file_path, 'rb') as f:
    content = f.read()

# Replace Windows CRLF with Unix LF
content = content.replace(b'\r\n', b'\n')

with open(file_path, 'wb') as f:
    f.write(content)

print(f"Fixed line endings in {file_path}")
