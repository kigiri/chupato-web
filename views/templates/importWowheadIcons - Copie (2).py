#!/usr/bin/python
# coding: utf-8
import requests
from bs4 import BeautifulSoup
import itertools
import thread
# from time import sleep
# from random import randrange
headers = {"User-Agent": "Mozilla/5.0 (iPad; U; CPU OS 3_2_1 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Mobile/7B405", "Referer": "www.wowhead.com" }
s = requests.Session()
threadCount = 8;
maxEntry = 56807

def getItem(item, log, threadName):
  response = s.get("http://www.wowhead.com/item=" + str(item), verify=False, headers= headers)
  soup = BeautifulSoup(response.text)
  img = soup.find("link", {'rel':"image_src"})
  if img:
    img = img['href']
    iconurl = img.split('/')
    icon = iconurl[7][:-4]
    out = "UPDATE aowow_items SET icon='{0}' WHERE entry='{1}';".format(icon, item)
    print "{0:5d} {2}".format(threadName, item, icon)
    print >> log, out

def getIcons(start, end):
  threadName = "icons{0:05d}-{0:05d}".format(start, end)
  log = open(threadName,"w")
  i = start;
  while (i < end):
    getItem(i, log, threadName)
    i = i + 1

step = threadCount / maxEntry
start = 0
while (j < threadCount):
  end = start + step
  try:
     thread.start_new_thread( getIcons, (start, end, ) )
  except:
     print "Error: unable to start thread"
  j = j + 1
  start = end

while 1:
   pass

