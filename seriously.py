#!/usr/bin/python
# -*- encoding: utf-8 -*-
import traceback, argparse, readline, hashlib, binascii, random, sys, codecs
from types import *
import commands

cp437table = u'\x00\u263a\u263b\u2665\u2666\u2663\u2660\u2022\u25d8\u25cb\u25d9\u2642\u2640\u266a\u266b\u263c\u25ba\u25c4\u2195\u203c\xb6\xa7\u25ac\u21a8\u2191\u2193\u2192\u2190\u221f\u2194\u25b2\u25bc !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7f\xc7\xfc\xe9\xe2\xe4\xe0\xe5\xe7\xea\xeb\xe8\xef\xee\xec\xc4\xc5\xc9\xe6\xc6\xf4\xf6\xf2\xfb\xf9\xff\xd6\xdc\xa2\xa3\xa5\u20a7\u0192\xe1\xed\xf3\xfa\xf1\xd1\xaa\xba\xbf\u2310\xac\xbd\xbc\xa1\xab\xbb\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255d\u255c\u255b\u2510\u2514\u2534\u252c\u251c\u2500\u253c\u255e\u255f\u255a\u2554\u2569\u2566\u2560\u2550\u256c\u2567\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256b\u256a\u2518\u250c\u2588\u2584\u258c\u2590\u2580\u03b1\xdf\u0393\u03c0\u03a3\u03c3\xb5\u03c4\u03a6\u0398\u03a9\u03b4\u221e\u03c6\u03b5\u2229\u2261\xb1\u2265\u2264\u2320\u2321\xf7\u2248\xb0\u2219\xb7\u221a\u207f\xb2\u25a0\xa0'

def ord_cp437(c):
    return cp437table.index(c) if c in cp437table else -1
    
def chr_cp437(o):
    return cp437table[o]

class Seriously(object):
    @classmethod
    def _make_new(cls,init_stack=[], debug_mode=False, repl_mode=False):
        return cls(init_stack,debug_mode)
    def make_new(self,*stack):
        return self._make_new(init_stack=list(stack), debug_mode=self.debug_mode)
        return res
    def __init__(self, init_stack=[], debug_mode=False, repl_mode=False, hex_mode=False):
        self.stack = init_stack
        self.debug_mode=debug_mode
        self.repl_mode = repl_mode
        self.fn_table = commands.fn_table
        self.code = ''
        self.hex_mode = hex_mode
        self.preserve = False
        self.pop_counter = 0
    def push(self,val):
        if type(val) is TupleType:
            val = list(val)
        if type(val) is BooleanType:
            val = int(val)
        self.stack=[val]+self.stack
    def pop(self):
        return self.stack.pop(0) if not self.preserve else self.preserve_pop()
    def preserve_pop(self):
        v = self.stack[self.pop_counter] if self.stack and len(self.stack) > self.pop_counter else None
        self.pop_counter += 1
        return v
    def peek(self):
        return self.stack[0] if self.stack else None
    def append(self, val):
        self.stack+=[val]
    def toggle_preserve(self):
        self.preserve = not self.preserve
    def eval(self, code, print_at_end=True):
        if self.hex_mode:
            code = binascii.unhexlify(code)
        i=0
        if self.repl_mode:
            self.code += code
        else:
            self.code = code
        while i < len(code):
            old_stack = self.stack[:]
            try:
                c = code[i]
                if c == '"':
                    s = ""
                    i+=1
                    while i<len(code) and code[i]!='"':
                        s+=code[i]
                        i+=1
                    self.push(s)
                elif c == "'":
                    i+=1
                    self.push(code[i])
                elif c == ':':
                    v = ""
                    i+=1
                    while i<len(code) and code[i]!=':':
                        v+=code[i]
                        i+=1
                    val = 0
                    try:
                        val = eval(v)
                    except:
                        pass
                    val = val if type(val) in [IntType,LongType,FloatType,ComplexType] else 0
                    self.push(val)
                elif c == 'W':
                    inner = ''
                    i+=1
                    while i<len(code) and code[i]!='W':
                        inner+=code[i]
                        i+=1
                    if self.debug_mode:
                        print "while loop code: %s"%inner
                    while self.peek():
                        self.eval(inner, print_at_end=False)
                elif c == '[':
                    l = ''
                    i+=1
                    while i<len(code) and code[i]!=']':
                        l+=code[i]
                        i+=1
                    self.push(eval('[%s]'%l))
                elif c == '`':
                    f = ''
                    i+=1
                    while i<len(code) and code[i]!='`':
                        f+=code[i]
                        i+=1
                    self.push(commands.SeriousFunction(f))
                elif ord(c) in range(48,58):
                    self.push(int(c))
                else:
                    if self.debug_mode:
                        print binascii.hexlify(chr(ord_cp437(c))).upper()
                    self.pop_counter = 0
                    self.fn_table.get(ord_cp437(c), lambda x:x)(self)
                    if self.debug_mode:
                        print self.stack
            except SystemExit:
                exit()
            except KeyboardInterrupt:
                exit()
            except:
                if self.debug_mode:
                    traceback.print_exc()
                self.stack = old_stack[:]
            finally:
                i+=1
        if not self.repl_mode and print_at_end:
            self.preserve = False
            while len(self.stack) > 0:
                print self.pop()

def srs_repl(debug_mode=False, quiet_mode=False, hex=False):
    srs = Seriously(repl_mode=True, debug_mode=debug_mode, hex_mode=hex)
    while 1:
        try:
            srs.eval(raw_input('' if quiet_mode else '>>> '))
        except EOFError:
            return
        finally:
            if not quiet_mode:
                print '\n'
                print srs.stack
            
def srs_exec(debug_mode=False, file_obj=None, code=None, hex=False):
    srs = Seriously(debug_mode=debug_mode, hex_mode=hex)
    if file_obj:
        srs.eval(file_obj.read())
        file_obj.close()
    else:
        srs.eval(code)
                
if __name__ == '__main__':
    sys.stdin = codecs.getreader('utf-8')(sys.stdin)
    sys.stdout = codecs.getwriter('utf-8')(sys.stdin)
    ufile = lambda *args,**kwargs: codecs.open(*args, **kwargs, encoding='utf-8')
    parser = argparse.ArgumentParser(description="Run the Seriously interpreter")
    parser.add_argument("-d", "--debug", help="turn on debug mode", action="store_true")
    parser.add_argument("-q", "--quiet", help="turn off REPL prompts and automatic stack printing, only print code STDOUT output", action="store_true")
    parser.add_argument("-x", "--hex", help="turn on hex mode (code is taken in hex values instead of binary bytes)", action="store_true")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("-c", "--code", help="run the specified code")
    group.add_argument("-f", "--file", help="specify an input file", type=ufile('rb'))
    args = parser.parse_args()
    if args.code or args.file:
        srs_exec(args.debug, args.file, args.code, args.hex)
    else:
        srs_repl(args.debug, args.quiet, args.hex)
    