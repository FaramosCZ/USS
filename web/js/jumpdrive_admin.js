// ----------------------------------------------------------------------------------------------
// 	Define role of our client. This role is sent to the server as a part of "connect" message
// ----------------------------------------------------------------------------------------------
var client_role = "admin";



// ----------------------------------------------------------------------------------------------
// 	PRINT FORMATED DATA ONTO SCREEN
// ----------------------------------------------------------------------------------------------
socket.on('admin_data_feed', function(data)
{
 console.log(logtime() + "[ DATA ] Incomming data feed: "); console.log(data);
 routes.load_data(data);

 // MAX routes
 document.getElementById("global_max_routes").value = routes.max_routes;

 // Reset DEL routes
 document.getElementById("delete_destination").innerHTML = "<option selected disabled> v v v v v </option>";

 // Global difficulty
 document.getElementById("global_difficulty_easy").removeAttribute("selected");
 document.getElementById("global_difficulty_easy").removeAttribute("selected");
 document.getElementById("global_difficulty_hard").removeAttribute("selected");
 document.getElementById("global_difficulty_insane").removeAttribute("selected");
 switch(routes.global_difficulty)
   {
    case "Easy":
      document.getElementById("global_difficulty_easy").setAttribute("selected", "");
      break;
    case "Medium":
      document.getElementById("global_difficulty_medium").setAttribute("selected", "");
      break;
    case "Hard":
      document.getElementById("global_difficulty_hard").setAttribute("selected", "");
      break;
    case "Insane":
      document.getElementById("global_difficulty_insane").setAttribute("selected", "");
      break;
   }



 // print table with header, titles, data and events
 result = "";
 result += "<tr style='font-weight:bold; text-align: center;'> <td colspan=2>DESTINACE</td> <td colspan=3>STATUS</td> <td>OBTÍŽNOST</td> <td colspan=3>SKOK</td> </tr>";


 for(single_route in routes.array_of_routes)
   {
    var target_destination = routes.array_of_routes[single_route]["destination"];

    result += "<tr><td title='Změní název destinace.\n!! VYUŽÍVAT S ROZUMEM !!\n\nRozhodně to hráče nepotěší, když se jim začnou měnit názvy které zadali pod rukama.\n\nTato funkce slouží pro opravy chyb a překlepů!'>";
    result += "<input type=text id='destination_"+target_destination+"' value='"+target_destination+"' onchange='change_destination(\""+target_destination+"\")' /></td>";

    result += "<td title='Nastaví destinaci jako nedosažitelnou.\n\nZablokuje možnost na tuto destinaci skočit a zablokuje možnost ji dále řešit!' >";
    result += "<button id='unreachable_"+target_destination+"' onclick='destination_unreachable(\""+target_destination+"\")'> ZABLOKOVAT </button> </td>";

    result += "<td id='status_"+target_destination+"' ></td>";

    result += "<td title='Vymaže všechen dosavadní postup hráčů v této destinaci a vygeneruje zcela nové sudoku zvolené obtížnosti.\nTakto je možné resetovat i již vyřešené destinace !\n\n Takto lze ODBLOKOVAT zablokované destinace ! \n\n !! VYUŽÍVAT S ROZUMEM !!' >";
    result += "<button id='new_"+target_destination+"' onclick='new_sudoku(\""+target_destination+"\")'> PŘEGENEROVAT </button></td>";

    result += "<td title='Okamžitě vyřeší sudoku pro danou destinaci, aby bylo možné skočit.' >";
    result += "<button id='instantly_solve_"+target_destination+"' onclick='solve(\""+target_destination+"\")'> VYŘEŠIT </button></td>";

    result += "<td style='text-align: center;' title='Nastaví obtížnost pro NOVĚ vygenerované sudoku pro tuto destinaci.\n\n!! Nezmění obtížnost aktuálního již vygenerovaného sudoku !!'>";
    result += "<select id='difficulty_"+target_destination+"' onchange='change_difficulty(\""+target_destination+"\")'> <option id='difficulty_easy_"+target_destination+"' value='Easy'>Lehké</option> <option id='difficulty_medium_"+target_destination+"' value='Medium'>Střední</option> <option id='difficulty_hard_"+target_destination+"' value='Hard'>Težké</option> <option id='difficulty_insane_"+target_destination+"' value='Insane'>Extrémní</option> </select> </td> ";

    result += "<td title='Po zahájení skoku začne odpočet X sekund, než loď opravdu skočí.\n(příprava motorů atp.)\n\nPo celou tuto dobu je možné skok přerušit - ať úmyslně či kvůli poruše' >";
    result += "Čas skoku: <input type=text id='jump_time_"+target_destination+"' size=3 pattern='[1-9][0-9]*' value='"+routes.array_of_routes[single_route]['jump_time_sec']+"' onchange='change_jump_time(\""+target_destination+"\")' /></td>";

    result += "<td title='Zahájí odpočet X sekund, než loď opravdu skočí.\n(příprava motorů atp.)\n\nPo celou tuto dobu je možné skok přerušit - ať úmyslně či kvůli poruše'>";
    result += "<button id='jump_countdown_"+target_destination+"' onclick='jump_countdown(\""+target_destination+"\")'> SKOK S ODPOČTEM </button></td>";
    
    result += "<td title='Skočit na cílové souřadnice IHNED\nTímto se zcela přeskočí odpočet.' >";
    result += "<button id='jump_now_"+target_destination+"' onclick='jump_now(\""+target_destination+"\")'> SKOČIT HNED </button></td>";
    result += "</tr>";
   }

 document.getElementById("coordinates_table").innerHTML = result;



 // Iterate again and now insert more data and change the elements properties
 for(single_route in routes.array_of_routes)
   {
    var target_destination = routes.array_of_routes[single_route]["destination"];

    document.getElementById("delete_destination").innerHTML += "<option value="+target_destination+">"+target_destination+"</option>";

    // -------------------------------------
    // STATUS
    // -------------------------------------
    document.getElementById("instantly_solve_"+target_destination).style.display = "initial";
    document.getElementById("jump_countdown_"+target_destination).style.display = "initial";
    document.getElementById("jump_now_"+target_destination).style.display = "initial";
    document.getElementById("unreachable_"+target_destination).style.display = "initial";

    switch(routes.array_of_routes[single_route]["status"])
      {
       // No client has even asked for a new Sudoku
       case "not_started":
         document.getElementById("status_"+target_destination).innerHTML = "<div style='background-color: yellow;'>ERROR!</div>";
         document.getElementById("status_"+target_destination).title = " ERROR!\n\nŽádné Sudoku ještě nebylo vygenerováno\n\n!!! Tento stav by neměl nikdy nastat !!!";
         // Ask for new data after 1 second
         setTimeout(function(){ socket.emit('admin_data_feed', ""); }, 1000);
         document.getElementById("jump_countdown_"+target_destination).style.display = "none";
         document.getElementById("jump_now_"+target_destination).style.display = "none";
         break;
       // Any client asked for a new sudoku and it is now ready to be solved
       case "generated":
         document.getElementById("status_"+target_destination).innerHTML = " Připraveno ";
         document.getElementById("status_"+target_destination).title = " Sudoku bylo vygenerováno.\n\nJe možné jej řešit";
         document.getElementById("jump_countdown_"+target_destination).style.display = "none";
         document.getElementById("jump_now_"+target_destination).style.display = "none";
         break;
       // Sudoku solved
       case "solved":
         document.getElementById("status_"+target_destination).innerHTML = "<div style='background-color: green;'>Vyřešeno</div>";
         document.getElementById("status_"+target_destination).title = " Sudoku bylo vyřešeno.\n\nJe možné SKOČIT";
         document.getElementById("instantly_solve_"+target_destination).style.display = "none";
         break
       // Doing a jump
       case "jumping":
         document.getElementById("status_"+target_destination).innerHTML = "<div style='background-color: green;'>!! Skáčeme !!</div>";
         document.getElementById("instantly_solve_"+target_destination).style.display = "none";
         break
       case "blocked":
         document.getElementById("status_"+target_destination).innerHTML = "<div style='background-color: red;'>Zablokováno</div>";
         document.getElementById("instantly_solve_"+target_destination).style.display = "none";
         document.getElementById("jump_countdown_"+target_destination).style.display = "none";
         document.getElementById("jump_now_"+target_destination).style.display = "none";
         document.getElementById("unreachable_"+target_destination).style.display = "none";
         break
       default:
         document.getElementById("status_"+target_destination).innerHTML = "<div style='background-color: yellow;'>ERROR: nerozpoznáno</div>";
         console.log(logtime() + "[ ERR! ] Status message has not been recognized: " + routes.array_of_routes[single_route]["status"] );
      }



    // -------------------------------------
    // DIFFICULTY
    // -------------------------------------
    document.getElementById("difficulty_easy_"+target_destination).removeAttribute("selected");
    document.getElementById("difficulty_medium_"+target_destination).removeAttribute("selected");
    document.getElementById("difficulty_hard_"+target_destination).removeAttribute("selected");
    document.getElementById("difficulty_insane_"+target_destination).removeAttribute("selected");
    switch(routes.array_of_routes[single_route]["difficulty"])
      {
       case "Easy":
         document.getElementById("difficulty_easy_"+target_destination).setAttribute("selected", "");
         break;
       case "Medium":
         document.getElementById("difficulty_medium_"+target_destination).setAttribute("selected", "");
         break;
       case "Hard":
         document.getElementById("difficulty_hard_"+target_destination).setAttribute("selected", "");
         break;
       case "Insane":
         document.getElementById("difficulty_insane_"+target_destination).setAttribute("selected", "");
         break;
      }


    // -------------------------------------
    // JUMP TIME
    // -------------------------------------
    document.getElementById("jump_time_"+target_destination).value = routes.array_of_routes[single_route]["jump_time_sec"];


   }

/*
 // DESTINATION
 if( data["destination"] == "" ) document.getElementById("button_destination_unreachable").style.display = "none";
 else document.getElementById("button_destination_unreachable").style.display = "initial";
 document.getElementById("destination").value = data["destination"];

*/

 // LIST OF CONNECTED CLIENTS
 var i = 0;
 document.getElementById("list_of_clients").innerHTML = "";
 for( client in data["clients_list"] )
   {
    var sid = Object.keys(data["clients_list"])[i];
    var line = "<span title="+sid+">IP: "+data["clients_list"][sid]["IP"]+" </span> ";
    line += " <input title='nickname' type='text' id='nickname_"+sid+"' onchange='change_nickname(this.id, this.value)' value='"+data["clients_list"][sid]["nickname"]+"' /> ";

    // roles
    line += " <select id='role_"+sid+"' onchange='change_role(this.id, this.value)'>"
    for( role in data["roles"] )
      {
       line += "<option value='"+data["roles"][role]+"'";
       if ( data["clients_list"][sid]["role"] == data["roles"][role] ) line += " selected";
       line += " \>"+data["roles"][role]+"</option>"
      }

    line += "</select> <br />";

    document.getElementById("list_of_clients").innerHTML += line;
    i++;
   }

});



// ----------------------------------------------------------------------------------------------
// 	Changing name of a destination
// ----------------------------------------------------------------------------------------------
function change_destination(destination)
{
 console.log(logtime() + "[ INFO ] Changing destination to: " + document.getElementById("destination_"+destination).value);
 if( !routes.array_of_routes.hasOwnProperty(destination) )
 {
  console.log(logtime() + "[ ERR! ] Can't change destination which is not in the list of destinations!");
  return;
 } 
 if( routes.array_of_routes.hasOwnProperty(document.getElementById("destination_"+destination).value) )
 {
  console.log(logtime() + "[ ERR! ] Can't change destination to one which already is in the list of destinations!");
  alert("Nelze mít 2 destinace se stejným názvem");
  document.getElementById("destination_"+destination).value = destination;
  return;
 } 

 socket.emit('change_destination', {destination: destination, new_destination: document.getElementById("destination_"+destination).value} );
}



// ----------------------------------------------------------------------------------------------
// 	Make destination unreachable
// ----------------------------------------------------------------------------------------------
function destination_unreachable(destination)
{
 console.log(logtime() + "[ INFO ] Making destination unreachable: " + destination);
 socket.emit('destination_unreachable', destination);
}



// ----------------------------------------------------------------------------------------------
// 	Requesting new sudoku. Don't care if players are already solving one or if they have any solved
// ----------------------------------------------------------------------------------------------
function new_sudoku(destination)
{
 console.log(logtime() + "[ INFO ] Sending request for a new Sudoku: " + destination);
 socket.emit('generate_new_sudoku', destination );
}



// ----------------------------------------------------------------------------------------------
// 	Requesting server to instantly solve the sudoku
// ----------------------------------------------------------------------------------------------
function solve(destination)
{
 console.log(logtime() + "[ INFO ] Sending request to solve the Sudoku instantly:" + destination);
 socket.emit('instantly_solve', destination);
}



// ----------------------------------------------------------------------------------------------
// 	Change difficulty
// ----------------------------------------------------------------------------------------------
function change_difficulty(destination)
{
 console.log(logtime() + "[ INFO ] Changing difficulty to: " + document.getElementById("difficulty_"+destination).value +" for: " + destination);
 socket.emit('change_difficulty', { "destination": destination, "difficulty": document.getElementById("difficulty_"+destination).value} );
}



// ----------------------------------------------------------------------------------------------
// 	Change jump time
// ----------------------------------------------------------------------------------------------
function change_jump_time(destination)
{
 if ( document.getElementById("jump_time_"+destination).checkValidity() == false ) { document.getElementById("jump_time_"+destination).style.border = "1px solid red"; return;}
 document.getElementById("jump_time_"+destination).style.borderColor = "initial";

 console.log(logtime() + "[ INFO ] Changing jump time to: " + document.getElementById("jump_time_"+destination).value + " for: " + destination);
 socket.emit('change_jump_time', { "destination": destination, "jump_time": document.getElementById("jump_time_"+destination).value} );
}



// ----------------------------------------------------------------------------------------------
// 	Jump with classic countdown
// ----------------------------------------------------------------------------------------------
function jump_countdown(destination)
{
 console.log(logtime() + "[ INFO ] Starting jump countdown: " + document.getElementById("jump_time_"+destination).value + " seconds for: " + destination);
 socket.emit('jump_countdown', destination);
}



// ----------------------------------------------------------------------------------------------
// 	Jump right now
// ----------------------------------------------------------------------------------------------
function jump_now(destination)
{
 console.log(logtime() + "[ INFO ] Starting jump immediatelly to: " + destination);
 socket.emit('jump_now', destination);
}



// ----------------------------------------------------------------------------------------------
// 	Change nickname of a specified client
// ----------------------------------------------------------------------------------------------
function change_nickname(id, value)
{
 var sid = id.substring(9);
 console.log(logtime() + "[ INFO ] Changing nickname of: " + sid + " to: " + value);
 socket.emit('change_nickname', {sid: sid, nickname: value});
}



// ----------------------------------------------------------------------------------------------
// 	Change role of a specified client
// ----------------------------------------------------------------------------------------------
function change_role(id, value)
{
 var sid = id.substring(5);
 console.log(logtime() + "[ INFO ] Changing role of: " + sid + " to: " + value);
 socket.emit('change_role', {sid: sid, role: value});
}



// ----------------------------------------------------------------------------------------------
// 	Change global difficulty
// ----------------------------------------------------------------------------------------------
function change_global_difficulty(value)
{
 console.log(logtime() + "[ INFO ] Changing global difficulty to: " + value);
 socket.emit('change_global_difficulty', value);
}



// ----------------------------------------------------------------------------------------------
// 	Change global maximum of destinations
// ----------------------------------------------------------------------------------------------
function change_global_max_routes(value)
{
 if ( document.getElementById("global_max_routes").checkValidity() == false ) { document.getElementById("global_max_routes").style.border = "1px solid red"; return;}
 document.getElementById("global_max_routes").style.borderColor = "initial";

 console.log(logtime() + "[ INFO ] Changing global maximum of routes to: " + value);
 socket.emit('change_global_max_routes', value);
}



// ----------------------------------------------------------------------------------------------
// 	ADD destination
// ----------------------------------------------------------------------------------------------
function admin_add_destination(destination)
{
 if( destination == "" ) { console.log(logtime() + "[ ERR! ] Cannot create destination with an empty name!"); return false; }

 // We can't add new route, if the maximum number of routes were already reached
 if( routes.current_routes >= routes.max_routes )
   {alert("!! ERROR !! \n\n Maximální počet destinací dosažen"); return false;}

 if( routes.array_of_routes.hasOwnProperty(destination) )
   {
    console.log(logtime() + "[ ERR! ] Can't change destination to one which already is in the list of destinations!");
    alert("Nelze mít 2 destinace se stejným názvem");
    return;
   } 

 console.log(logtime() + "[ INFO ] Sending request for ADD_ROUTE");
 socket.emit('add_route', destination);

 document.getElementById("add_destination").value = "";
}



// ----------------------------------------------------------------------------------------------
// 	DELETE destination
// ----------------------------------------------------------------------------------------------
function admin_del_destination(destination)
{
 if( destination == "" || destination == " " ) { console.log(logtime() + "[ ERR! ] Cannot delete destination with an empty name!"); return false; }

 if( !routes.array_of_routes.hasOwnProperty(destination) )
   {
    console.log(logtime() + "[ ERR! ] Can't delete destination which is not in the list of destinations!");
    alert("Destinace není na výběr pro smazání");
    return;
   } 

 console.log(logtime() + "[ INFO ] Sending request for DEL_ROUTE");
 socket.emit('del_route', destination);
}

