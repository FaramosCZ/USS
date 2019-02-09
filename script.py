#!/usr/bin/python3

from flask import Flask, render_template, send_from_directory, request
from flask_socketio import SocketIO, join_room

import sys

### We need random number generator to create unique hashes for the clients.
import random

### This will be the Unique ID of this instance of the server
server_uid = hex(random.getrandbits(128))
server_uid_json = {}
server_uid_json["server_uid"] = server_uid

### Let the Flask app initialize
app = Flask("new_project", template_folder='web')
app.config['SECRET_KEY'] = 'secret!_' + hex(random.getrandbits(128))
socketio = SocketIO(app)

### The app needs destination where the players wnats to travel
destination = ""
difficulty = "Easy"




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
    print("[ INFO ] INDEX RENDERED")
    return render_template('index.html')

### Returns the admin default webpage
@app.route('/admin')
def admin_index():
    print("[ INFO ] ADMIN RENDERED")
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
    print('[ INFO ] RECIEVED STATUS_INFO: ' + str( json["message"] ))
    print('[ DATA ] CLIENT UID: ' +  request.sid)
    if ( str(json["server_uid"]) != server_uid ):
        print('[ DATA ]   CLIENT SIDE STORED SERVER_UID:' + str( json["server_uid"] ))
        print('[ WARN ]   SERVER_UID MISMATCH, sending the client a reload request')
        socketio.emit("server_uid", server_uid_json, json=True, broadcast=False, room=request.sid)
    else :
        print('[  OK  ]   SERVER_UID MATCH')
        # Up-to-date clients are added to the room "clients",
        # so we can later broadcast messages to the whole room
        join_room('clients')
        print('[ INFO ]   CLIENT '+request.sid+' HAS JOINED THE ROOM "CLIENTS"')
        # Later distinguish between roles of the clients
        if ( str(json["type"]) == "user" ):
            join_room('users')
            print('[ INFO ]   CLIENT '+request.sid+' HAS JOINED THE ROOM "USERS"')
        elif ( str(json["type"]) == "admin" ):
            join_room('admins')
            print('[ INFO ]   CLIENT '+request.sid+' HAS JOINED THE ROOM "ADMINS"')



@socketio.on('new_sudoku_request')
def new_sudoku_request(json):
    """Generate new sudoku"""
    print('[ INFO ] RECIEVED MESSAGE: ' + str( json["message"] ))
    print('[ INFO ] RECIEVED DESTINATION: ' + str( json["destination"] ))
    global destination
    destination = str( json["destination"] )
    print('[ INFO ] GENERATING NEW SUDOKU' )

    sys.path.append(sys.path[0]+"/sudoku")
    from sudoku import main
    new_sudoku = main(difficulty)
    print('[ DATA ] NEW SUDOKU: ' + str(new_sudoku) )
    socketio.emit("new_sudoku", new_sudoku, json=False, broadcast=False, room='clients')



@socketio.on('sudoku_solved')
def sudoku_solved(json):
    """Check solved sudoku"""
    print('[ INFO ] RECIEVED SUDOKU: ' + str( json["sudoku"] ))
    print('[ INFO ] SENDING DESTINATION: ' + destination)
    ### Aditional checks not yet implemented. Checks are done on the client side
    socketio.emit("sudoku_solved_confirmed", destination, json=False, broadcast=False, room='clients')



@socketio.on('my_test_action')
def handle_my_test_action(json):
    print('[ INFO ] RECIEVED ACTION: ' + str(json))
    if( json["action"] == "1" ):
        print("   test case 1")
    elif(json["action"] == "2"):
        print("   test case 2")
    elif(json["action"] == "switch"):
        admin_index()





### MUST be at the end of file, after all socketio parameters has been defined !!
if __name__ == '__main__':
    print(" ")
    print("[ INFO ] SERVER STARTED")
    print('[ DATA ] SERVER UID: ' + server_uid)
    socketio.run(app, debug=False, host='127.0.0.1')
