#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TabBar图标生成脚本
自动生成所有需要的PNG图标文件
"""

try:
    from PIL import Image, ImageDraw
    import os
except ImportError:
    print("需要安装Pillow库: pip install Pillow")
    exit(1)

# 图标配置
ICONS = {
    'home': 'M12 3L2 12H5V20H19V12H22L12 3Z',
    'task': 'M19 3H14.82C14.4 1.84 13.3 1 12 1C10.7 1 9.6 1.84 9.18 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM12 3C12.55 3 13 3.45 13 4C13 4.55 12.55 5 12 5C11.45 5 11 4.55 11 4C11 3.45 11.45 3 12 3ZM14 17H7V15H14V17ZM17 13H7V11H17V13ZM17 9H7V7H17V9Z',
    'add': 'M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM17 13H13V17H11V13H7V11H11V7H13V11H17V13Z',
    'street': 'M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM11 11H7V7H11V11ZM17 11H13V7H17V11ZM11 17H7V13H11V17ZM17 17H13V13H17V17Z',
    'mine': 'M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z'
}

COLORS = {
    'normal': '#94a3b8',
    'active': '#1677ff'
}

SIZE = 81
VIEWBOX_SIZE = 24

def parse_svg_path(path_data):
    """解析SVG路径数据，转换为绘制命令"""
    commands = []
    i = 0
    while i < len(path_data):
        if path_data[i].isalpha():
            cmd = path_data[i]
            i += 1
            coords = []
            num_str = ''
            while i < len(path_data):
                char = path_data[i]
                if char.isalpha() or char in 'MmLlHhVvCcSsQqTtAaZz':
                    break
                if char in ', ':
                    if num_str:
                        coords.append(float(num_str))
                        num_str = ''
                else:
                    num_str += char
                i += 1
            if num_str:
                coords.append(float(num_str))
            commands.append((cmd, coords))
        else:
            i += 1
    return commands

def draw_path(draw, path_data, color, size):
    """绘制SVG路径"""
    scale = size / VIEWBOX_SIZE
    padding = (SIZE - size) / 2
    
    # 简化的路径绘制 - 使用矩形和圆形近似
    if 'home' in path_data or path_data.startswith('M12 3L2'):
        # 房子图标
        points = [
            (SIZE/2, padding + 5*scale),  # 顶部
            (padding + 2*scale, padding + 12*scale),  # 左下
            (padding + 5*scale, padding + 12*scale),  # 左墙
            (padding + 5*scale, SIZE - padding - 4*scale),  # 左下角
            (SIZE - padding - 5*scale, SIZE - padding - 4*scale),  # 右下角
            (SIZE - padding - 5*scale, padding + 12*scale),  # 右墙
            (SIZE - padding - 2*scale, padding + 12*scale),  # 右上
        ]
        draw.polygon(points, fill=color)
    elif 'task' in path_data or 'M19 3H14' in path_data:
        # 任务列表图标
        draw.rectangle([padding + 3*scale, padding + 3*scale, SIZE - padding - 3*scale, SIZE - padding - 3*scale], 
                      outline=color, width=int(2*scale))
        # 横线
        for y in [padding + 9*scale, padding + 13*scale, padding + 17*scale]:
            draw.line([padding + 7*scale, y, SIZE - padding - 7*scale, y], fill=color, width=int(2*scale))
    elif 'add' in path_data or 'M12 2C6' in path_data:
        # 加号图标
        center = SIZE / 2
        radius = size / 2 - padding - 2*scale
        draw.ellipse([center - radius, center - radius, center + radius, center + radius], 
                    outline=color, width=int(2*scale))
        # 加号
        line_width = int(3*scale)
        draw.line([center, center - 5*scale, center, center + 5*scale], fill=color, width=line_width)
        draw.line([center - 5*scale, center, center + 5*scale, center], fill=color, width=line_width)
    elif 'street' in path_data or 'M19 3H5' in path_data:
        # 街道/网格图标
        cell_size = (size - 2*padding) / 2
        for i in range(2):
            for j in range(2):
                x1 = padding + i * cell_size
                y1 = padding + j * cell_size
                x2 = x1 + cell_size
                y2 = y1 + cell_size
                draw.rectangle([x1, y1, x2, y2], outline=color, width=int(2*scale))
    elif 'mine' in path_data or 'M12 12C14' in path_data:
        # 用户图标
        center_x = SIZE / 2
        # 头部（圆形）
        head_radius = 3*scale
        draw.ellipse([center_x - head_radius, padding + 4*scale, 
                     center_x + head_radius, padding + 10*scale], fill=color)
        # 身体（半圆）
        body_points = [
            (center_x, padding + 10*scale),
            (center_x - 4*scale, SIZE - padding - 2*scale),
            (center_x + 4*scale, SIZE - padding - 2*scale),
        ]
        draw.polygon(body_points, fill=color)

def create_icon(name, color, path_data):
    """创建单个图标"""
    # 创建透明背景
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 转换颜色
    color_rgb = tuple(int(color[i:i+2], 16) for i in (1, 3, 5))
    
    # 绘制路径
    draw_path(draw, path_data, color_rgb, SIZE - 20)  # 留出边距
    
    return img

def main():
    """主函数"""
    # 确保目录存在
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    print("开始生成TabBar图标...")
    
    for icon_name, path_data in ICONS.items():
        # 生成未选中状态
        if not icon_name.endswith('-active'):
            normal_img = create_icon(icon_name, COLORS['normal'], path_data)
            normal_img.save(f'{icon_name}.png', 'PNG')
            print(f"✓ 已生成: {icon_name}.png")
        
        # 生成选中状态
        active_img = create_icon(icon_name, COLORS['active'], path_data)
        active_img.save(f'{icon_name}-active.png', 'PNG')
        print(f"✓ 已生成: {icon_name}-active.png")
    
    print("\n所有图标生成完成！")
    print(f"图标保存在: {script_dir}")

if __name__ == '__main__':
    main()
