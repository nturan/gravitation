import pexpect
import time
import datetime

file = open('Ephemeris.js', 'w')
file.write('Ephemeris = {')
file.write('bodies : [\n')

stars = ['10']
starsName = ['Sun']
starsRadius = [6.955E+05]
starsMass = [1.988544E+07]
planets = ['199', '299', '399', '499', '599', '699', '799', '899', '999']
planetsName = ['Mercur', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
planetsRadius = [2440, 6052, 6371, 3390, 69911, 54364, 24973, 24342, 1195]
planetsMass = [3.302, 48.685, 59.7219, 6.4185, 18981.3, 5683.19, 868.103, 1024, 0.1307]
moons = ['301', '501', '502', '503', '504', '601', '602', '603', '604', '605', '606', '608']
moonsName = ['Moon', 'Io', 'Europa', 'Ganymede', 'Callisto', 'Mimas', 'Enceladus', 'Tethys',
            'Dione', 'Rhea', 'Titan', 'Iapetus']
moonsRadius = [1737, 1821.3, 1565, 2634, 2403, 198.8, 252.3, 536.3, 562.5, 764.5, 2575.5, 734.5]
moonsMass = [734.9E-3, 893.3E-03, 479.7E-03, 1482.0E-03, 1076.0E-03, 3.75E-04, 10.805E-04, 61.76E-04,
            109.572E-04, 230.9E-04, 13455.3E-04, 180.59E-04]

objects = stars + planets + moons
names = starsName + planetsName + moonsName
radiuses = starsRadius + planetsRadius + moonsRadius
masses = starsMass + planetsMass + moonsMass
n = len(objects)
cutFrom = 182
scrollTimeOut = 0.05
StartingTime = datetime.date.today()
EndingTime = StartingTime + datetime.timedelta(days=1)
d = pexpect.spawn("telnet horizons.jpl.nasa.gov 6775")
print("connection opened")
def createRow(name, radius, mass, initialValues):
#   result = name + ',' + str(mass) + ',' + str(radius)
  fixedValues = initialValues.split('\n')
  initialPos = fixedValues[2]
#   print(initialPos)
  initialVel = fixedValues[3]
#   print(initialVel)
  x = str(initialPos[initialPos.find('X =')+3:initialPos.find('Y =')])
#   print(x)
  y = str(initialPos[initialPos.find('Y =')+3:initialPos.find('Z =')])
#   print(y)
  z = str(initialPos[initialPos.find('Z =')+3:-1])
#   print(z)
  vx = str(initialVel[initialVel.find('VX=')+3:initialVel.find('VY=')])
#   print(vx)
  vy = str(initialVel[initialVel.find('VY=')+3:initialVel.find('VZ=')])
#   print(vy)
  vz = str(initialVel[initialVel.find('VZ=')+3:-1])
#   print(vz)
  result = "new Body(\"" + name + '\",' + str(mass) + ',' + str(radius) + ',[' +\
   x + ',' + y + ',' + z + '],[' + vx + ',' + vy + ',' + vz + '])\n'
  return result

for x in range(0, n):
  if x is not 0 :
    d.expect('Select')  
    d.sendline('N')
  d.expect('Horizons>')  
  d.sendline(objects[x])
  dataStr = ""
  d.setwinsize(80, 2000)
  
  
  time.sleep(scrollTimeOut)
#   print('asking for Select')
  d.expect('Select')
  d.sendline('E')
  time.sleep(scrollTimeOut)
  d.expect('Observe')
#   print('asking for observables')
  d.sendline("v")
  time.sleep(scrollTimeOut)
  index = d.expect(['Coordinate', 'previous'])
  if index == 0:
    d.sendline("@ssb")
  else:
    d.sendline('y')
  time.sleep(scrollTimeOut)
  d.expect('Reference')
  d.sendline("eclip")
  time.sleep(scrollTimeOut)
  d.expect('Starting')
  d.sendline(StartingTime.strftime("%Y-%m-%d"))
  time.sleep(scrollTimeOut)
  d.expect('Ending')
  d.sendline(EndingTime.strftime("%Y-%m-%d"))
  time.sleep(scrollTimeOut)
  d.expect('Output interval')
  d.sendline('1d')
  time.sleep(scrollTimeOut)
  d.expect('Accept default output')
#   print('asking for confirm')
  d.sendline('y')
  time.sleep(scrollTimeOut*10)
  dataStr = d.read_nonblocking(size=10000, timeout=1).decode('utf-8')
  startOfData = dataStr.find("$$SOE")+5
  endOfData = dataStr.find("LT=")
  file.write(createRow(names[x], radiuses[x], masses[x], dataStr[startOfData:endOfData]))
  if x is not n-1:
    file.write(',')
#   print(createRow(names[x], radiuses[x], masses[x], dataStr[startOfData:endOfData]))
#   print(dataStr[startOfData:endOfData])
  print("ephemeris for " + names[x] + " are printed")
  
d.close(force=True)
print("connection closed")
file.write(']')
file.write('};')
file.close()


  
