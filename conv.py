from os import walk, path, rename
import re


files = []
i = 0
for dir_path, _dir_names, file_names in walk("./src"):
    files.extend(list(map(lambda name: path.join(dir_path, name), file_names)))

files = list(filter(lambda f: f.endswith(".js"), files))

matcher = r"(.+)(?:\.js)$"

for file in files:
    rename(file, re.sub(matcher, r"\1.ts", file))
