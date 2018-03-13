import pexpect
import time
import datetime

d = pexpect.spawn("telnet horizons.jpl.nasa.gov 6775")
d.expect("Hori.*")
d.send("399\n")

cutFrom = 182
StartingTime = datetime.date.today()
EndingTime = StartingTime + datetime.timedelta(days=1)


for x in range(0,35):
  print(d.readline())

  
exitScroll = False
while not exitScroll:
  index = d.expect([pexpect.EOF, pexpect.TIMEOUT, 'Select'], timeout=1)
  if index == 0:
      exitScroll = True
  elif index == 1:
      print('scrolling')
      d.sendline("\x1b[B")
      for x in range(0,23):
        d.readline()
      print(d.readline()[cutFrom:])
  elif index == 2:
      exitScroll = True
      print('asking for Selection')
      d.sendline("E")
      print(d.readline())



d.expect('Observe')
print('asking for observables')
d.sendline("v")
print(d.readline())
d.expect('Coordinate')
print('asking for coord center')
d.sendline("@ssb")
print(d.readline())
d.expect('Reference')
print('asking for reference plane')
d.sendline("eclip")
print(d.readline())
d.expect('Starting')
print('asking for starting date')
d.sendline(StartingTime.strftime("%Y-%m-%d"))
print(d.readline())
d.expect('Ending')
print('asking for ending date')
d.sendline(EndingTime.strftime("%Y-%m-%d"))
d.expect('Output interval')
print('asking for output interval')
d.sendline('1d')
d.expect('Accept default output')
print('asking for confirm')
d.sendline('y')

for x in range(0,25):
  print(d.readline())

  
exitScroll = False
while not exitScroll:
  index = d.expect([pexpect.EOF, pexpect.TIMEOUT, 'Select'], timeout=1)
  if index == 0:
      exitScroll = True;
  elif index == 1:
      print('scrolling')
      d.sendline("\x1b[B")
      for x in range(0,23):
        d.readline()
      print(d.readline()[cutFrom:])
  elif index == 2:
      exitScroll = True;
