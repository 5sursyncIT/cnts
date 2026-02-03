import xml.etree.ElementTree as ET
import json

tree = ET.parse('temp_senegal.svg')
root = tree.getroot()

# Namespaces handling
ns = {'svg': 'http://www.w3.org/2000/svg', 'hc': 'https://highcharts.com/docs/mc'}

regions = []

for path in root.findall('.//svg:path', namespaces=ns):
    d = path.get('d')
    desc = path.find('svg:desc', namespaces=ns)
    name = "Unknown"
    if desc is not None:
        name_elem = desc.find('hc:name', namespaces=ns)
        if name_elem is not None:
            name = name_elem.text
    
    regions.append({
        'name': name,
        'd': d
    })

print(json.dumps(regions, indent=2))
