// ----------------------------------------------------------------------------------------------
// 	COMMON FUNCTIONS FOR ALL CLIENTS
// ----------------------------------------------------------------------------------------------

// Recieve and store client IP
socket.on('client_IP', function(data)
{
 console.log(logtime() + "[ DATA ] Recieved my IP: " + data);
 // Write IP into a dedicated element on the page, if any exists
 if( document.getElementById("client_identification") != null ) document.getElementById("client_identification").innerHTML = data;
 // Also update a nickname, if one is stored
 if( sessionStorage.getItem('nickname') != null ) change_nickname(sessionStorage.getItem('nickname'));
});


// Change nickname
function change_nickname(data)
{
 console.log(logtime() + "[ DATA ] Recieved new nickname: " + data);

 // Write NICKNAME into a dedicated element on the page, if any exists
 if( document.getElementById("client_identification") != null )
   {
    if( document.getElementById("nickname") != null ) document.getElementById("nickname").innerHTML = data;
    else document.getElementById("client_identification").innerHTML += "<br /><span id='nickname'>"+data+"</span>";
   }

 console.log(logtime() + "[ INFO ] Creating session storage key pair NICKNAME");
 // Also save the new nickname to the session storage
 sessionStorage.setItem('nickname', data);
}

// Nickname has changed
socket.on('change_nickname', function(data){ change_nickname(data); });

// My role has changed
socket.on('change_role', function(data)
{
 console.log(logtime() + "[ DATA ] Recieved new role: " + data);
 window.location.href = "/" + data;
});

