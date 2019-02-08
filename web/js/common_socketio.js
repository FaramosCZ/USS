// Common functions for socketIO used by all clients

// Each instance of the server has an unique UID.
// We save it and use it for check, if the server changed / updated.
// In such case, we need to reload the webpage to get up-to-date content.
var server_uid = getCookie("server_uid");
console.log(" ");
console.log("SERVER UID is now set to: " + server_uid);

// Initialize the socketIO stuff
var socket = io.connect('http://' + document.domain + ':' + location.port);



// Once loaded, notify the server that we are online
// Also register our client_type (user, admin, ...)
socket.on('connect', function()
{
 console.log("Recieved message CONNECT");
 console.log("Sending message STATUS_INFO");
 socket.emit('status_info',
   {
    message: 'Render on the client has been successful!',
    server_uid: server_uid,
    type: client_type
   });
});



// This message deals with the changes on the server. If the server UID chnaged,
// we need to reload our page to get up-to-date content.
socket.on('server_uid', function(data)
{
 console.log("Recieved message SERVER_UID");
 console.log("Recieved data:"+data);
 console.log("Server UID:"+data["server_uid"]);
 if (server_uid != data["server_uid"])
  {
   console.log("Creating cookie SERVER_UID");
   setCookie("server_uid", data["server_uid"], 1)
   document.cookie = "server_uid="+data["server_uid"];
   console.log("Reloading");
   location.reload();
  }
 else
  {
   console.log("Sending message STATUS_INFO");
   socket.emit('status_info',
     {
      message: 'Server UID is up-to-date',
      server_uid: server_uid
     });
  }
});

// --------------
