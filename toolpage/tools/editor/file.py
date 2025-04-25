# Modify editor index.html to add red line element
with open('editor index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Find the minimap container closing tag
container_end_tag = '</div' # Find the closing tag for minimap-container
container_end_pos = html_content.find('>', html_content.find('<div id="minimap-container"'))
if container_end_pos != -1:
    inner_container_end_pos = html_content.rfind(container_end_tag, 0, container_end_pos)
    # A bit fragile, assumes structure is <div id="minimap-container">...<div id="minimap-viewport"></div></div>
    # Find the closing div of minimap-container more reliably
    mc_start = html_content.find('<div id="minimap-container"')
    mc_content_start = html_content.find('>', mc_start) + 1
    # Find matching closing div (simple count - might fail with nested divs)
    level = 1
    current_pos = mc_content_start
    while level > 0 and current_pos < len(html_content):
        open_div = html_content.find('<div', current_pos)
        close_div = html_content.find('</div', current_pos)

        if open_div != -1 and (close_div == -1 or open_div < close_div):
            level += 1
            current_pos = open_div + 4
        elif close_div != -1:
            level -= 1
            current_pos = close_div + 5
        else:
            break # No more divs
    mc_end = current_pos if level == 0 else -1


    if mc_end != -1:
         # Insert red line div before the closing tag of minimap-container
         red_line_html = """
                <div id="minimap-red-line" class="minimap-red-line"></div>"""
         html_content = html_content[:mc_end] + red_line_html + html_content[mc_end:]

         with open('editor index.html', 'w', encoding='utf-8') as f:
            f.write(html_content)
         print("File updated: editor index.html (Added minimap-red-line div)")
    else:
         print("Error: Could not reliably find the end of minimap-container in editor index.html")

else:
    print("Error: Could not find minimap-container start in editor index.html")