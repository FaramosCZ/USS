#!/usr/bin/python3

'''
AUTHOR:
  Name:     Michal Schorm
  Contact:  mschorm@redhat.com
  Year:     2019
  License:  MIT

  Based on software of: Tomáš Látal
  Using Sudoku generator found on GitHub from Joe Carlson:
    https://github.com/JoeKarlsson/python-sudoku-generator-solver
  Clients using simple futuristic desing - CSS sheet written also by me.

  Fun fact: My first python code ever :)

ABOUT:
  This application is supposed to be a game. Part of a spaceship simulator.
  Player(s) control a jumpdrive panel (jumpdrive is a type of FTL drive).
  To get ready for a jump, player(s) need to set their desired destination and then compute the
  route to it. (To avoid colisions with cosmic objects on the route).

  The "computing" is being done by solving a Sudoku puzzle.

TECHNOLOGY:
  Python 3
  Python 3 virtual environment
  Flask, SocektIO
  JS, HTML, CSS

SPECIFICATIONS:
  This software is divided to server and clients parts.
  Server is written in Python 3 and it runs a very simple web server.
  Clients are Web pages, served by the server, running JS SocketIO for asynchronous communication
  with the server via web sockets. Both Server and clients reacts on incomming sockets, creating
  dynamic and responsive application. The main advantage is that clients can be run on any device
  with a decent web browser (it is nearly year 2020, so no IE and garbage like that !)

  Server:
  Server prints out a number of log messages in format of "time [type] message". At the startup,
  server prints one blank line. As a part of the first log message it prints out current date.

  Server uses a slightly tweaked sudoku generator, found on the GitHub. Sudoku is being sent
  between the server and client(s) as a string of 81 numbers (9x9 fields), where "0" are not
  interpreted in the client.

  Server has an unique UID, generated upon startup. When any client connects, it *must* check
  if the UID of the server it is currently communicating with matches the UID client saved on
  its initial connection. If the UID mismatch, the client needs to reload.
  This is *needed* when a server is restarted with newer version of the client(s) webpage(s).
  If the client won't check the server UID, it may use outdated code, which will cause bugs
  and possibly harming the server by sending malformed data.

  The SocketIO allows the server to create "rooms". The server can than move every client to
  any number of rooms. The server can send a socket either to the client it is communicating
  with or to a whole room.
  This is very allows us to have multiple clients running, while any of them can cause all
  devices wide change. For example if a single client solves the Sudoku puzzle, all clients
  are notified and a solved puzzle is sent to them, saying "good job, work done". If any of
  the clients want to start computing new coordinates, the solution is discarted and all
  clients recieve new sudoku for a new destination.

  The server will automaticly try to find its IP address, printing it out as a part of the few
  first information. Clients needs to use that specific address.

  Clients:
  Clients can be of various types. By default you want a player and an admin page. Since
  all clients are webpages server by the server, it is easy to add new ones, not matter its
  role.

  Clients prints out a number of JS log messages in format of "time [type] message".

  Player should be able to ask for new coordinates, solve the puzzle, and get confirmation
  on the solution


TODO:
* Server should allow the players to ask for mutliple destinations. The client should have a
  list of destinations form current location, allowing multiple clients to solve any of them.
  Other clients would no longer discard solved Sudokus.
* Server should hold a database of know jumps (routes). If the players would travel often
  between two points, the shouldn't need to compute them again for a certain time.
* In both above cases, server needs to save a permanent data file with those information.
  Once restarted, admin should be able to select what will recover.
* It would be nice for the player client to be able to slowly autocomplete the Sudoku Puzzle.
  It should express the spaceship navigation computer to do its job. Admin should of course
  set the speed of atuo-completion (1 entry per 20s by default?)
* It would be nice, if the players could cooperate on the solving. The player's clients would
  have to show location of each player (on which cell they have a focus currently) a syncing
  the work across the clients. This way, the auto-completion bot could be done as a standalone
  client run by the administrator.
* The Admin interface is not yet done
* The Admin interface should allow to choose CSS - having a minimal version. With different
  software we need a single Master-Admin console aggregating all admin pages, allowing the
  operator to administer them easily.
* Some clients should be read only.
* Some clients should be only able to set destinations and do a jump. Such use-case can be on
  a spaceship bridge, when they only care about those, while engineering sections makes them
  ready.
* Destination, which has been solved, should be selectable for a jump. Once selected, a huge
  countdown (60 sec?) should appear, allowing some clients to abort the jump (spaceship bridge?)
  And of course admin - to simulate a failure.
* This application should also be connected to the rest of the software, consuming and sending
  messages to the dispatcher. For example failure of hyperdrive or not enough fuel should prevent
  the players to proceed with a jump.
* Add documentation about on how to set up thy Python 3 virtual environment to run this app.
  (What needs to be installed inside)
* Add help to the server
* Change default port?
  Add information about the firewall

TODO priority:
* Add IP and an identification of a client
* Admin - be able to name clients
* Client - show it's name onmouseover on its IP

* Admin
 - reset, discard, name client, change difficulty, change destination, confirm destination
 - show list of clients
 - switch solved
   * Server should check the corectness of the solution, not just its formate.

* Add a (MIT) license file
* Client should get a box explaining the rules of the Sudoku puzzle.

'''

from flask import Flask, render_template, send_from_directory, request
from flask_socketio import SocketIO, join_room

### System path to aditional python scripts
from sys import path
### Get this machine IP
from socket import gethostbyname, gethostname
### We need random number generator to create unique hashes for the clients.
from random import getrandbits
### Current time to save into server logs
from datetime import datetime

### Sudoku generator
path.append(path[0]+"/sudoku")
from sudoku import main

### This will be the Unique ID of this instance of the server
server_uid = hex(getrandbits(128))
server_uid_json = {}
server_uid_json["server_uid"] = server_uid

### Let the Flask app initialize
app = Flask("new_project", template_folder='web')
app.config['SECRET_KEY'] = 'secret!_' + hex(getrandbits(128))
socketio = SocketIO(app)

### Debug option
debug = False

### The app needs destination where the players wnats to travel
destination = ""
difficulty = "Easy"
sudoku_data = ""
sudoku_data_solved = ""
solved = False



### Function to write nice server log:
log = lambda : datetime.now().strftime("%H:%M:%S ")





### Disable all web cache
@app.after_request
def add_header(request):
    request.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    request.headers["Pragma"] = "no-cache"
    request.headers["Expires"] = "0"
    request.headers['Cache-Control'] = 'public, max-age=0'
    return request

### This function serves JS files from /web/js/ folder.
@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('web/js', path)

### This function serves CSS files from /web/css/ folder.
@app.route('/css/<path:path>')
def send_css(path):
    return send_from_directory('web/css', path)

### Returns the default webpage for the user
@app.route('/')
def user_index():
    print( log() + '[ INFO ] INDEX RENDERED')
    return render_template('index.html')

### Returns the admin default webpage
@app.route('/admin')
def admin_index():
    print( log() + '[ INFO ] ADMIN RENDERED')
    return render_template('admin.html')





### Define events which will the clients send to me
@socketio.on('status_info')
def status_info(json):
    """When a new updated instance of the server is run, make sure, that client have the
    the latest website. The spawned server has a unique UID.
    If the client holds correct UID of the server, everything is alright.
    If the client holds different value, it means it was created with older version of
    the server and thus we need it to save the current UID and reload itself to get the
    latest changes made to the websites.

    Once the server UID is correct, move clients into rooms as needed."""
    print( log() + '[ INFO ] RECIEVED STATUS_INFO: ' + str( json["message"] ))
    print( log() + '[ DATA ] CLIENT IP: ' +  request.remote_addr)
    if debug:
        print( log() + '[ DATA ] CLIENT UID: ' +  request.sid)
    if ( str(json["server_uid"]) != server_uid ):
        print( log() + '[ DATA ]   CLIENT SIDE STORED SERVER_UID:' + str( json["server_uid"] ))
        print( log() + '[ WARN ]   SERVER_UID MISMATCH, sending the client a reload request')
        socketio.emit("server_uid", server_uid_json, json=True, broadcast=False, room=request.sid)
    else :
        print( log() + '[  OK  ]   SERVER_UID MATCH')
        # Up-to-date clients are added to the room "clients",
        # so we can later broadcast messages to the whole room
        join_room('clients')
        print( log() + '[ INFO ]   CLIENT '+request.remote_addr+' HAS JOINED THE ROOM "CLIENTS"')
        # Later distinguish between roles of the clients
        if ( str(json["type"]) == "user" ):
            join_room('users')
            print( log() + '[ INFO ]   CLIENT '+request.remote_addr+' HAS JOINED THE ROOM "USERS"')
        elif ( str(json["type"]) == "admin" ):
            join_room('admins')
            print( log() + '[ INFO ]   CLIENT '+request.remote_addr+' HAS JOINED THE ROOM "ADMINS"')
        # Send client it's IP
        socketio.emit("client_IP", request.remote_addr, json=False, broadcast=False, room=request.sid)
        # If the puzzle has already been solved, send the solution:
        if solved == True :
            json_data_to_send = {}
            json_data_to_send["destination"] = destination
            json_data_to_send["sudoku_data"] = sudoku_data_solved
            socketio.emit("sudoku_solved_confirmed", json_data_to_send, json=True, broadcast=False, room=request.sid)
        # If a puzzle has already been distributed, send it to the new client:
        elif sudoku_data != "" :
            socketio.emit("new_sudoku", sudoku_data, json=False, broadcast=False, room=request.sid)




@socketio.on('new_sudoku_request')
def new_sudoku_request(json):
    """Generate new sudoku"""
    print( log() + '[ INFO ] RECIEVED MESSAGE: ' + str( json["message"] ))
    print( log() + '[ INFO ] RECIEVED DESTINATION: ' + str( json["destination"] ))
    global solved
    solved = False
    global sudoku_data_solved
    sudoku_data_solved = ""
    global destination
    destination = str( json["destination"] )
    print( log() + '[ INFO ] GENERATING NEW SUDOKU' )

    global sudoku_data
    sudoku_data = main(difficulty)
    if debug:
        print( log() + '[ DATA ] NEW SUDOKU: ' + str(sudoku_data) )
    socketio.emit("new_sudoku", sudoku_data, json=False, broadcast=False, room='clients')



@socketio.on('sudoku_solved')
def sudoku_solved(json):
    """Check solved sudoku"""
    if debug:
        print( log() + '[ INFO ] RECIEVED SUDOKU: ' + str( json["sudoku"] ))
    else:
        print( log() + '[ INFO ] RECIEVED SUDOKU')
    global sudoku_data
    if len(str( json["sudoku"] )) != 81 :
        print( log() + '[ ERR! ] RECIEVED SUDOKU CHECK FAILED - TOO SHORT!')
        socketio.emit("sudoku_solved_denied", "RECIEVED_LENGTH", json=False, broadcast=False, room=request.sid)
        return
    elif len(sudoku_data) != 81 :
        print( log() + '[ ERR! ] STORED SUDOKU CHECK FAILED - TOO SHORT!')
        socketio.emit("sudoku_solved_denied", "STORED_LENGTH", json=False, broadcast=False, room=request.sid)
        return
    for i in range(81) :
        if not "1" <= str( json["sudoku"] )[i] <= "9":
            print( log() + '[ ERR! ] RECIEVED SUDOKU IS NOT COMPLETED - CHECK FAILED ON POSITION: ' + str(i+1))
            socketio.emit("sudoku_solved_denied", "RECIEVED_NOT_COMPLETED", json=False, broadcast=False, room=request.sid)
            return
        elif sudoku_data[i] == "0" :
            continue
        elif sudoku_data[i] != str( json["sudoku"] )[i] :
            print( log() + '[ ERR! ] RECIEVED SUDOKU CHECK FAILED ON POSITION: ' + str(i+1))
            socketio.emit("sudoku_solved_denied", "RECIEVED_DOES_NOT_MATCH_STORED", json=False, broadcast=False, room=request.sid)
            return
    print( log() + '[ INFO ] SENDING DESTINATION: ' + destination)
    global solved
    solved = True
    global sudoku_data_solved
    sudoku_data_solved = str( json["sudoku"] )
    ### Aditional checks not yet implemented. Checks are done on the client side
    json_data_to_send = {}
    json_data_to_send["destination"] = destination
    json_data_to_send["sudoku_data"] = sudoku_data_solved
    socketio.emit("sudoku_solved_confirmed", json_data_to_send, json=True, broadcast=False, room='clients')



@socketio.on('client_leaving')
def client_leaving(data):
    print( log() + '[ INFO ] CLIENT LEAVING: ' + request.remote_addr )



@socketio.on('my_test_action')
def handle_my_test_action(json):
    print( log() + '[ INFO ] RECIEVED ACTION: ' + str(json))
    if( json["action"] == "1" ):
        print("   test case 1")
    elif(json["action"] == "2"):
        print("   test case 2")
    elif(json["action"] == "switch"):
        admin_index()





### MUST be at the end of file, after all socketio parameters has been defined !!
if __name__ == '__main__':
    print(" ")
    print( log() + '[ INFO ] SERVER STARTED: ' + datetime.now().strftime("%d.%m.%Y %H:%M:%S") )
    if debug:
        print( log() + '[ DATA ] SERVER UID: ' + server_uid)
    ip = gethostbyname(gethostname())
    print( log() + '[ DATA ] SERVER IP: ' + ip)
    socketio.run(app, debug=False, host=ip)
