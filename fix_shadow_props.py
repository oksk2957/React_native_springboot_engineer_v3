import os
import re

def replace_shadow_props(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # shadowColor, shadowOffset, shadowOpacity, shadowRadius 패턴 매칭
    # 객체 내부의 스타일 정의를 찾아서 boxShadow로 변환
    pattern = re.compile(
        r'shadowColor:\s*[\'"](.+?)[\'"],\s*'
        r'shadowOffset:\s*\{\s*width:\s*(\d+),\s*height:\s*(\d+)\s*\},\s*'
        r'shadowOpacity:\s*([\d\.]+),\s*'
        r'shadowRadius:\s*(\d+),',
        re.DOTALL
    )
    
    def shadow_to_boxshadow(match):
        color = match.group(1)
        width = match.group(2)
        height = match.group(3)
        opacity = match.group(4)
        radius = match.group(5)
        # rgba 변환 (단순화된 버전)
        rgba = f"rgba(0, 0, 0, {opacity})" if color == "#000" else color
        return f"boxShadow: '{width}px {height}px {radius}px {rgba}',"

    new_content = pattern.sub(shadow_to_boxshadow, content)
    
    if content != new_content:
        print(f"Updated shadow props in: {file_path}")
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.tsx'):
                file_path = os.path.join(root, file)
                replace_shadow_props(file_path)

if __name__ == "__main__":
    main()
