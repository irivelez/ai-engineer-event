import sys,re
lines=open(sys.argv[1]).read().split('\n')
def sec(s):
    h,m,x=[int(v) for v in s.split(':')]; return h*3600+m*60+x
a,b=sec(sys.argv[2]),sec(sys.argv[3])
w=int(sys.argv[4]) if len(sys.argv)>4 else 400
for l in lines:
    m=re.match(r'\[(\d+:\d+:\d+)\]',l)
    if m and a<=sec(m.group(1))<=b: print(l[:w])
