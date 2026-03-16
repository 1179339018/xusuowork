# -*- coding: utf-8 -*-
import os
try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Installing Pillow...")
    os.system("pip install Pillow")
    from PIL import Image, ImageDraw

SIZE = 81
COLORS = {'normal': '#94a3b8', 'active': '#1677ff'}

def create_home_icon(color):
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    rgb = tuple(int(color[i:i+2], 16) for i in (1, 3, 5))
    # 房子
    points = [(SIZE/2, 15), (15, 35), (15, SIZE-15), (SIZE-15, SIZE-15), (SIZE-15, 35), (SIZE-10, 35)]
    draw.polygon(points, fill=rgb)
    return img

def create_task_icon(color):
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    rgb = tuple(int(color[i:i+2], 16) for i in (1, 3, 5))
    # 矩形框
    draw.rectangle([20, 20, SIZE-20, SIZE-20], outline=rgb, width=3)
    # 横线
    for y in [35, 45, 55]:
        draw.line([30, y, SIZE-30, y], fill=rgb, width=2)
    return img

def create_add_icon(color):
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    rgb = tuple(int(color[i:i+2], 16) for i in (1, 3, 5))
    # 圆形
    draw.ellipse([15, 15, SIZE-15, SIZE-15], outline=rgb, width=3)
    # 加号
    center = SIZE / 2
    draw.line([center, center-12, center, center+12], fill=rgb, width=4)
    draw.line([center-12, center, center+12, center], fill=rgb, width=4)
    return img

def create_street_icon(color):
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    rgb = tuple(int(color[i:i+2], 16) for i in (1, 3, 5))
    # 网格
    cell = (SIZE - 30) / 2
    for i in range(2):
        for j in range(2):
            x1, y1 = 15 + i*cell, 15 + j*cell
            x2, y2 = x1 + cell, y1 + cell
            draw.rectangle([x1, y1, x2, y2], outline=rgb, width=3)
    return img

def create_mine_icon(color):
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    rgb = tuple(int(color[i:i+2], 16) for i in (1, 3, 5))
    # 头部
    draw.ellipse([SIZE/2-10, 20, SIZE/2+10, 40], fill=rgb)
    # 身体
    points = [(SIZE/2, 40), (SIZE/2-15, SIZE-15), (SIZE/2+15, SIZE-15)]
    draw.polygon(points, fill=rgb)
    return img

icons = {
    'home': create_home_icon,
    'task': create_task_icon,
    'add': create_add_icon,
    'street': create_street_icon,
    'mine': create_mine_icon
}

for name, func in icons.items():
    # 未选中
    img = func(COLORS['normal'])
    img.save(f'{name}.png', 'PNG')
    print(f'Created: {name}.png')
    # 选中
    img = func(COLORS['active'])
    img.save(f'{name}-active.png', 'PNG')
    print(f'Created: {name}-active.png')

print('All icons created!')
