import re
with open('src/routes/index.tsx','r') as f:
    c = f.read()
c = re.sub(r'<a href="(/[^"]*)"', lambda m: '<Link to="'+m.group(1)+'"', c)
c = re.sub(r'</a>', '</Link>', c)
with open('src/routes/index.tsx','w') as f:
    f.write(c)
print('done')
