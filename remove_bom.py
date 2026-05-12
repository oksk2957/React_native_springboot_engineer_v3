import os

def remove_bom(file_path):
    with open(file_path, 'rb') as f:
        content = f.read()
    
    if content.startswith(b'\xef\xbb\xbf'):
        print(f"Removing BOM from: {file_path}")
        with open(file_path, 'wb') as f:
            f.write(content[3:])
        return True
    return False

def main():
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.java'):
                file_path = os.path.join(root, file)
                remove_bom(file_path)

if __name__ == "__main__":
    main()
