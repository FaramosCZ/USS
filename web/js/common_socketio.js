// Common functions for socketIO used by all clients

// Add a function to generate current time %H:%M:%S
function logtime()
{
 var date = new Date();
 return ""+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+" ";
}

// Each instance of the server has an unique UID.
// We save it and use it for check, if the server changed / updated.
// In such case, we need to reload the webpage to get up-to-date content.
var server_uid = sessionStorage.getItem('server_uid');
console.log(" ");
console.log(logtime() + "[ INFO ] SERVER UID is now set to: " + server_uid);

// Initialize the socketIO stuff
var socket = io.connect('http://' + document.domain + ':' + location.port);



// Once loaded, notify the server that we are online
// Also register our client_role (user, admin, ...)
socket.on('connect', function()
{
 console.log(logtime() + "[ INFO ] Recieved message CONNECT");
 console.log(logtime() + "[ INFO ] Sending message STATUS_INFO");

 var nickname = sessionStorage.getItem('nickname');
 if ( nickname == null ) nickname="";

 socket.emit('status_info',
   {
    message: 'Render on the client has been successful!',
    server_uid: server_uid,
    role: client_role,
    nickname: nickname
   });
});



// This message deals with the changes on the server. If the server UID chnaged,
// we need to reload our page to get up-to-date content.
socket.on('server_uid', function(data)
{
 console.log(logtime() + "[ INFO ] Recieved new SERVER_UID: "+data);
 if (server_uid != data)
  {
   console.log(logtime() + "[ INFO ] Creating session storage key pair SERVER_UID");
   sessionStorage.setItem('server_uid', data);
   console.log(logtime() + "[ INFO ] Reloading");
   location.reload();
  }
 else
  {
   console.log(logtime() + "[ INFO ] Sending message STATUS_INFO");
   socket.emit('status_info',
     {
      message: 'Server UID is up-to-date',
      server_uid: server_uid
     });
  }
});



// Notify server, that the client decided to leave the page
window.onbeforeunload = function()
{
 // Handled automaticly by SockeIO
 //socket.emit('client_leaving', "client_leaving");
 console.log(logtime() + "[ INFO ] Leaving page");
};

