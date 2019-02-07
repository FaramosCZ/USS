#!/usr/bin/python3

from flask import Flask, render_template
from flask_socketio import SocketIO

app = Flask("new_project", template_folder='web')
app.config['SECRET_KEY'] = 'secret!_tzudioftcf'
socketio = SocketIO(app)





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
    print('[ INFO ] RECIEVED STATUS_INFO: ' + str( json["message"] ))

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
    print("[ INFO ] SERVER STARTED")
    socketio.run(app, debug=False, host='127.0.0.1')


