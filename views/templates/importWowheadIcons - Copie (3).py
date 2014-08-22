#!/usr/bin/python
# coding: utf-8
import requests
from bs4 import BeautifulSoup
import itertools
# from time import sleep
# from random import randrange
headers = {"User-Agent": "Mozilla/5.0 (iPad; U; CPU OS 3_2_1 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Mobile/7B405", "Referer": "www.wowhead.com" }
s = requests.Session()
log = open("iconlist.txt","w")
def getItem(item):
  response = s.get("http://www.wowhead.com/item=" + str(item), verify=False, headers= headers)
  soup = BeautifulSoup(response.text)
  img = soup.find("link", {'rel':"image_src"})
  if img:
    img = img['href']
    iconurl = img.split('/')
    icon = iconurl[7][:-4]
    out = "UPDATE aowow_items SET icon='{0}' WHERE entry='{1}';".format(icon, item)
    print out
    print >> log, out


i = 35000;
while (i < 45000):
  getItem(i)
  i = i + 1
