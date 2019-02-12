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
  Clients can be of various roles. By default you want a player and an admin page. Since
  all clients are webpages server by the server, it is easy to add new ones, not matter its
  role.

  Clients prints out a number of JS log messages in format of "time [type] message".

  Player should be able to ask for new coordinates, solve the puzzle, and get confirmation
  on the solution


TODO:
* Server should check the corectness of the solution, not just its formate.
* It would be nice for the player client to be able to slowly autocomplete the Sudoku Puzzle.
  It should express the spaceship navigation computer to do its job. Admin should of course
  set the speed of atuo-completion (1 entry per 20s by default?)
* It would be nice, if the players could cooperate on the solving. The player's clients would
  have to show location of each player (on which cell they have a focus currently) a syncing
  the work across the clients. This way, the auto-completion bot could be done as a standalone
  client run by the administrator.
* Some clients should be read only.
* Some clients should be only able to set destinations and do a jump. Such use-case can be on
  a spaceship bridge, when they only care about those, while engineering sections makes them
  ready.
* This application should also be connected to the rest of the software, consuming and sending
  messages to the dispatcher. For example failure of hyperdrive or not enough fuel should prevent
  the players to proceed with a jump.
* Add documentation about on how to set up thy Python 3 virtual environment to run this app.
  (What needs to be installed inside)
* Add help to the server
* Change default port?
  Add information about the firewall

TODO priority:

* Player should get a box explaining the rules of the Sudoku puzzle.

* Server should allow the players to ask for mutliple destinations. The client should have a
  list of destinations form current location, allowing multiple clients to solve any of them.
  Other clients would no longer discard solved Sudokus.
* Server should hold a database of know jumps (routes). If the players would travel often
  between two points, the shouldn't need to compute them again for a certain time.
* In both above cases, server needs to save a permanent data file with those information.
  Once restarted, admin should be able to select what will recover.
* Destination, which has been solved, should be selectable for a jump. Once selected, a huge
  countdown (60 sec?) should appear, allowing some clients to abort the jump (spaceship bridge?)

* The Admin interface should allow to choose CSS - having a minimal version. With different
  software we need a single Master-Admin console aggregating all admin pages, allowing the
  operator to administer them easily.

* logger does not respect global variable "debug"


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

### Let the Flask app initialize
app = Flask("new_project", template_folder='web')
app.config['SECRET_KEY'] = 'secret!_' + hex(getrandbits(128))
socketio = SocketIO(app)

### Debug option
debug = False

### ROLES
# This list is based on what is actually available in the application. Do not change
roles = ("admin", "player")









### OOP
### Object of a single route
class route:
    '''This class is supposed to hold all information server has available about a single route (jump from point A to point B)'''
    destination = ""
    difficulty = "Easy"
    sudoku_data = ""
    sudoku_data_generated_solution = ""
    sudoku_data_player_solution = ""
    status = "not_started" # ("not_started", "generated", "solved", "jumping")
    jump = ""
    jump_time_sec = 60


### Object holding all of the routes
class list_of_routes:
    max_routes = 1
    dict_of_routes = {}

### Object of a single client
class client:
    sid = ""
    IP = ""
    role = ""
    nickname = ""

    def __init__(self, sid, ip, role=roles[0], nickname=""):
        self.sid = sid; self.ip = ip; self.role = role; self.nickname = nickname

    def set_nickname(self, nickname):
        self.nickname = nickname
    def get_nickname(self):
        return self.nickname

    def set_role(self, role):
        self.role = role
    def get_role(self):
        return self.role

    def get_ip(self):
        return self.ip

### Object holding all of the clients
class list_of_clients:
    dict_of_clients = {}

    def add_client(self, sid, ip, role=roles[0], nickname=""):
        self.dict_of_clients[sid] = client(sid, ip, role, nickname)
        admin_data_feed('admin')
    def del_client(self, sid):
        if not self.dict_of_clients.pop(sid, None):
            log.error("TRIED TO DELETE CLIENT WHICH WAS NOT IN A LIST OF CLIENTS !")
            return False
        admin_data_feed('admin')

    def set_nickname(self, sid, nickname):
        self.dict_of_clients[sid].set_nickname(nickname)
        admin_data_feed('admin')
    def get_nickname(self, sid):
        return self.dict_of_clients[sid].get_nickname()

    def set_role(self, sid, role):
        if role in roles:
            self.dict_of_clients[sid].set_role(role)
        else:
            log.error("TRIED TO SET CLIENT ROLE THAT DOES NOT EXIST !")
            return False
        admin_data_feed('admin')
    def get_role(self, sid):
        return self.dict_of_clients[sid].get_role()

    def get_ip(self, sid):
        return self.dict_of_clients[sid].get_ip()

    def get_dict_of_clients(self):
        # Style:   { sid: { "IP": IP, "nickname" : nickname, "role": role } }
        result = {}
        for key in self.dict_of_clients:
            result[key] = {}
            result[key]["IP"] = self.get_ip(key)
            result[key]["nickname"] = self.get_nickname(key)
            result[key]["role"] = self.get_role(key)
        # Extreme debug:
        #log.debug("SENT CLIENTS INFO: " + str(result) )
        return result












### GLOBAL INFORMATION
destination = ""
difficulty = "Easy"
sudoku_data = ""
sudoku_generated_solution = ""
sudoku_data_solved = ""
status = "not_started" # ("not_started", "generated", "solved", "jumping")
jump = ""
jump_time_sec = 60





### Function to give admin all the data
def admin_data_feed(admin_sid):
    json_data_to_send = {}
    json_data_to_send["destination"] = destination
    json_data_to_send["difficulty"] = difficulty
    json_data_to_send["status"] = status
    json_data_to_send["jump"] = jump
    json_data_to_send["jump_time_sec"] = jump_time_sec
    json_data_to_send["roles"] = roles
    json_data_to_send["client_list"] = clients.get_dict_of_clients()
    socketio.emit("admin_data_feed", json_data_to_send, json=True, broadcast=False, room=admin_sid)
    log.debug('    FEEDING ADMINS: ' + request.remote_addr )
     




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
    log.debug('INDEX RENDERED')
    return render_template('index.html')

### Returns the admin default webpage
@app.route('/player')
def player_index():
    log.debug('PLAYER RENDERED')
    return render_template('index.html')

### Returns the admin default webpage
@app.route('/admin')
def admin_index():
    log.debug('ADMIN RENDERED')
    return render_template('admin.html')





### Define events which will the clients send to me
@socketio.on('connect')
def client_joining():
    clients.add_client(request.sid, request.remote_addr, nickname=request.remote_addr)
    log.debug('CLIENT JOINED SERVER: ' + clients.get_nickname(request.sid) )



@socketio.on('disconnect')
def client_leaving():
    log.debug('CLIENT LEAVED SERVER: ' + clients.get_nickname(request.sid) )
    clients.del_client(request.sid)






@socketio.on('status_info')
def status_info(json):
    """When a new updated instance of the server is run, make sure, that client have the
    the latest website. The spawned server has a unique UID.
    If the client holds correct UID of the server, everything is alright.
    If the client holds different value, it means it was created with older version of
    the server and thus we need it to save the current UID and reload itself to get the
    latest changes made to the websites.
    Once the server UID is correct, move clients into rooms as needed."""

    log.debug('RECIEVED STATUS_INFO: ' + str(json["message"]) + " FROM: " + request.remote_addr )
    log.debug('  CLIENT UID: ' +  request.sid )

    # Check server UID saved on the client side
    if ( str(json["server_uid"]) != server_uid ):
        log.debug('  CLIENT SIDE STORED SERVER_UID: ' + str(json["server_uid"]) )
        log.debug('  SERVER_UID MISMATCH, sending the client a reload request' )
        socketio.emit("server_uid", server_uid, json=False, broadcast=False, room=request.sid)
        # In this case, client will need to reload, so it will quit and join server again
        return
    log.info('  SERVER_UID MATCH')
    # Up-to-date clients are added to the room "clients", so we can later broadcast messages to the whole room
    join_room('clients')
    log.debug('  CLIENT '+clients.get_nickname(request.sid)+' HAS JOINED THE ROOM "CLIENTS"')

    # Update client nickname, if some is set
    log.info('  CLIENT SIDE STORED NICKNAME: ' + str(json["nickname"]) )
    if str(json["nickname"]) != "" :
        clients.set_nickname(request.sid, str(json["nickname"]) )
        log.debug('  SAVED NICKNAME: ' + clients.get_nickname(request.sid) )

    # Update client role, if some is set
    log.info('  CLIENT SIDE STORED ROLE: ' + str(json["role"]) )
    if str(json["role"]) != "" :
        if clients.set_role(request.sid, str(json["role"]) ) == False :
            # Roles are accepted only those explicitly named in 'roles' tuple
            socketio.emit("role_unknown", str(json["role"]), json=False, broadcast=False, room=request.sid)
            return
        log.debug('  SAVED ROLE: ' + clients.get_role(request.sid) )

    # Default rooms are named exactly same as the available roles
    join_room(clients.get_role(request.sid))
    log.info('  CLIENT '+clients.get_nickname(request.sid)+' HAS JOINED THE ROOM: '+clients.get_role(request.sid))

    # Send client it's IP, because it is unable to find it out with JS
    socketio.emit("client_IP", request.remote_addr, json=False, broadcast=False, room=request.sid)

    # If an admin joined, feed him
    if clients.get_role(request.sid) == "admin":
        admin_data_feed(request.sid)

    # If the puzzle has already been solved, send the solution:
    if status == "solved" :
       json_data_to_send = {}
       json_data_to_send["destination"] = destination
       json_data_to_send["sudoku_data"] = sudoku_data_solved
       socketio.emit("sudoku_solved_confirmed", json_data_to_send, json=True, broadcast=False, room=request.sid)
    # If a puzzle has already been distributed, send it to the new client:
    elif status == "generated" :
       socketio.emit("new_sudoku", sudoku_data, json=False, broadcast=False, room=request.sid)




@socketio.on('new_sudoku_request')
def new_sudoku_request(json):
    """Generate new sudoku"""
    log.info('RECIEVED MESSAGE: ' + str( json["message"] ))
    log.info('RECIEVED DESTINATION: ' + str( json["destination"] ))
    global status
    status = "generated"
    global sudoku_data_solved
    sudoku_data_solved = ""
    global destination
    destination = str( json["destination"] )
    log.info('GENERATING NEW SUDOKU' )

    results = main(difficulty)
    global sudoku_data
    sudoku_data = results[0]
    global sudoku_generated_solution
    sudoku_generated_solution = results[1]
    log.debug('NEW SUDOKU: ' + str(sudoku_data) )
    log.debug('SOLUTION:   ' + str(sudoku_generated_solution) )
    admin_data_feed('admin')
    socketio.emit("new_sudoku", sudoku_data, json=False, broadcast=False, room='clients')



@socketio.on('sudoku_solved')
def sudoku_solved(json):
    """Check solved sudoku"""
    log.info('RECIEVED SUODKU')
    log.debug('RECIEVED SUODKU: ' + str( json["sudoku"] ))
    global sudoku_data
    global generated_solution
    # First check if the player guessed the same solution as was generated
    if not sudoku_generated_solution == str( json["sudoku"] ):
        # Else check the solution manually
        if len(str( json["sudoku"] )) != 81 :
            log.warning('RECIEVED SUDOKU CHECK FAILED - TOO SHORT!')
            socketio.emit("sudoku_solved_denied", "RECIEVED_LENGTH", json=False, broadcast=False, room=request.sid)
            return
        elif len(sudoku_data) != 81 :
            log.warning('STORED SUDOKU CHECK FAILED - TOO SHORT!')
            socketio.emit("sudoku_solved_denied", "STORED_LENGTH", json=False, broadcast=False, room=request.sid)
            return
        for i in range(81) :
            if not "1" <= str( json["sudoku"] )[i] <= "9":
                log.warning('RECIEVED SUDOKU IS NOT COMPLETED - CHECK FAILED ON POSITION: ' + str(i+1))
                socketio.emit("sudoku_solved_denied", "RECIEVED_NOT_COMPLETED", json=False, broadcast=False, room=request.sid)
                return
            elif sudoku_data[i] == "0" :
                continue
            elif sudoku_data[i] != str( json["sudoku"] )[i] :
                log.warning('RECIEVED SUDOKU CHECK FAILED ON POSITION: ' + str(i+1))
                socketio.emit("sudoku_solved_denied", "RECIEVED_DOES_NOT_MATCH_STORED", json=False, broadcast=False, room=request.sid)
                return
    log.info('SENDING DESTINATION: ' + destination)
    global status
    status = "solved"
    global sudoku_data_solved
    sudoku_data_solved = str( json["sudoku"] )
    ### Aditional checks not yet implemented. Checks are done on the client side
    json_data_to_send = {}
    json_data_to_send["destination"] = destination
    json_data_to_send["sudoku_data"] = sudoku_data_solved
    admin_data_feed('admin')
    socketio.emit("sudoku_solved_confirmed", json_data_to_send, json=True, broadcast=False, room='clients')



@socketio.on('instantly_solve')
def instantly_solve(data):
    log.info('RECIEVED REQUEST TO SOLVE INSTANTLY')
    if not sudoku_data:
        json_data_to_send = {}
        json_data_to_send["message"] = "Server request to generate new Sudoku"
        json_data_to_send["destination"] = destination
        new_sudoku_request(json_data_to_send)
    json_data_to_send = {}
    json_data_to_send["sudoku"] = sudoku_generated_solution
    sudoku_solved(json_data_to_send)



@socketio.on('change_destination')
def change_destination(data):
    log.info('CHANGING DESTINATION TO: ' + data)
    global destination
    destination = data
    admin_data_feed('admin')
    if status == "solved" or status == "jumping":
        socketio.emit("change_destination", data, json=False, broadcast=False, room='player')



@socketio.on('destination_unreachable')
def destination_unreachable(data):
    log.info('DESTINATION UNREACHABLE: ' + data)
    global destination
    destination = ""
    global sudoku_data
    sudoku_data = ""
    global sudoku_generated_solution
    sudoku_generated_solution = ""
    global sudoku_data_solved
    sudoku_data_solved = ""
    global status
    status = "not_started"
    global jump
    jump = ""
    socketio.emit("destination_unreachable", data, json=False, broadcast=False, room='player')
    admin_data_feed('admin')



@socketio.on('change_jump_time')
def change_jump_time(data):
    log.info('CHANGING JUMP TIME TO: ' + data + ' seconds')
    global jump_time_sec
    jump_time_sec = data
    admin_data_feed('admin')



@socketio.on('change_difficulty')
def change_difficulty(data):
    log.info('CHANGING DIFFICULTY TO: ' + data )
    global difficulty
    difficulty = data
    admin_data_feed('admin')



@socketio.on('change_nickname')
def change_nickname(json):
    log.info('CHANGING NICKNAME OF: ' + clients.get_nickname(str(json["sid"])) + " TO: " + str(json["nickname"]) )
    clients.set_nickname(str(json["sid"]), str(json["nickname"]) )
    # Notify the particular client, that his nickname has changed
    socketio.emit("change_nickname", clients.get_nickname(str(json["sid"])), json=False, broadcast=False, room=str( json["sid"] ))



@socketio.on('change_role')
def change_role(json):
    log.info('CHANGING ROLE OF: ' + clients.get_nickname(request.sid) + " TO: " + str(json["role"]) )
    if clients.set_role(request.sid, str(json["role"]) ) == False:
        # Desired role does not exist
        return
    # Notify the particular client, that his role has changed
    socketio.emit("change_role", clients.get_role(request.sid), json=False, broadcast=False, room=str( json["sid"] ))



@socketio.on('admin_data_feed')
def updating_admin(data):
    admin_data_feed(request.sid)





### Setup logger
def configure_logger(enabled_logger='default', level='DEBUG', log_path='./logs/', log_name='log_' + datetime.now().strftime("%d.%m.%Y_%H_%M") ):
    """ Setup logger to both console and a log file."""
    import logging
    import logging.config

    import os
    if not os.path.exists(log_path):
        os.mkdir(log_path)
 
    logging.config.dictConfig({
        'version': 1,
        'formatters': {
            'default': {'format': '%(asctime)s [ %(levelname).4s ] %(message)s', 'datefmt': '%H:%M:%S'}
        },
        'handlers': {
            'console': {
                'level': level,
                'class': 'logging.StreamHandler',
                'formatter': 'default',
                'stream': 'ext://sys.stdout'
            },
            'file': {
                'level': level,
                'class': 'logging.handlers.RotatingFileHandler',
                'formatter': 'default',
                'filename': log_path+"/"+log_name,
                'maxBytes': 1024,
                'backupCount': 3
            }
        },
        'loggers': {
            'default': {
                'level': level,
                'handlers': ['console', 'file']
            }
        },
        'disable_existing_loggers': False
    })
    return logging.getLogger(enabled_logger)




### MUST be at the end of file, after all socketio parameters has been defined !!
if __name__ == '__main__':
    print(" ")
    # Create logger instance
    log = configure_logger(level="INFO")
    # Declare the master objects of this application
    clients = list_of_clients()
    routes = list_of_routes()
    # Start the server
    log.info('SERVER STARTED: ' + datetime.now().strftime("%d.%m.%Y %H:%M:%S"))
    log.debug('SERVER UID: ' + server_uid)
    ip = gethostbyname(gethostname())
    log.info('SERVER IP: ' + ip)
    socketio.run(app, debug=False, host=ip, port=5000)

