#!/usr/bin/env python

import re, codecs

def make_explanations():
    lines = []
    with codecs.open('commands.txt','Urb',encoding='utf-8') as f:
        lines = f.read().split('\n')[:256]
    ex = "var explanations = {\n%s\n};"
    exps = []
    rg = re.compile(r'^[0-9A-F]{2} \((.+)\): (.*)$')
    for line in lines:
        res = rg.search(line)
        if res:
            val, desc = res.groups()
            exps.append('%s:%s'%(`val`[1:],`desc`[1:]))
    with codecs.open('static/explanations.js','wb',encoding='utf-8') as f:
        f.write(ex%(u',\n'.join(exps)))
        
if __name__ == '__main__':
    make_explanations()