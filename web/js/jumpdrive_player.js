// ----------------------------------------------------------------------------------------------
// 	Define role of our client. This role is sent to the server as a part of "connect" message
// ----------------------------------------------------------------------------------------------
var client_role = "player";



// ----------------------------------------------------------------------------------------------
// 	ADD ROUTE (display result on the player's screen)
// ----------------------------------------------------------------------------------------------

function add_route_player(destination)
{
 // We don't accept an empty destination name
 if( destination == "" ) { console.log(logtime() + "[ ERR! ] Cannot create destination with an empty name!"); return false; }

 // We can't add new route, if the maximum number of routes were already reached
 if( routes.current_routes >= routes.max_routes )
   {
    console.log(logtime() + "[ ERR! ] Maximum nuber of routes reached!");

    // Spawn a box saying the error message
    var error_max_routes = document.createElement("DIV");
    error_max_routes.setAttribute("id", "error_max_routes");
    error_max_routes.setAttribute("class", "text_red_full");
    document.body.appendChild(error_max_routes);
    document.getElementById("error_max_routes").innerHTML = "!! ERROR !! <br /> Maximální počet destinací dosažen"
    // Delete the spawned box after few seconds
    setTimeout( function()
       {
        var error_max_routes_element = document.getElementById("error_max_routes");
        if (error_max_routes_element != null) error_max_routes_element.remove();
       }, 3000);

    return false;
   }

 // Now we want to send request to the server for a new Sudoku
 if ( add_route(destination) )
   {
    // While the Sudoku is being generated, spawn a box saying it is "in progress"
    var generating_progress = document.createElement("DIV");
    generating_progress.setAttribute("id", "generating_progress");
    generating_progress.setAttribute("class", "text_blue");
    var generating_progress_text = document.createTextNode("ZÍSKÁVÁM CÍLOVÉ KOORDINÁTY");
    generating_progress.appendChild(generating_progress_text);
    document.body.appendChild(generating_progress);
   }
}



// ----------------------------------------------------------------------------------------------
// 	DEL ROUTE (display result on the player's screen)
// ----------------------------------------------------------------------------------------------
function del_route_player(destination)
{
 if( !confirm("Přejete si opravdu vymazat destinaci: '"+destination+"' ?\nTato operace je NEVRATNÁ!") ) return false;

 del_route(destination)

 // Reset the displayed infromation
 routes.active = "";
 document.getElementById("list_of_details").innerHTML = "";
 empty_board();
}



// ----------------------------------------------------------------------------------------------
// 	INCOMMING DATA FROM SERVER
// ----------------------------------------------------------------------------------------------
socket.on('players_data_feed', function(data)
{
 console.log(logtime() + "[ DATA ] Incomming data feed: "); console.log(data);
 routes.load_data(data);

 // Reset the displayed infromation
 document.getElementById("list_of_details").innerHTML = "";
 empty_board();

 print_list_of_routes();

 // Delete the "In progress" box
 var generating_progress = document.getElementById("generating_progress");
 if (generating_progress != null) generating_progress.remove();
 var destination_unreachable = document.getElementById("destination_unreachable");
 if (destination_unreachable != null) destination_unreachable.remove();

 // If any route is open, display also its Sudoku and its deatils
 if( routes.active != "" ) show_details("route_"+routes.active);
});



// ----------------------------------------------------------------------------------------------
// 	PRINT LIST OF ROUTES
// ----------------------------------------------------------------------------------------------
function print_list_of_routes()
{
 result = "";

 for(single_route in routes.array_of_routes)
   {
    result += "<button id='route_"+single_route+"' class='button_";
    if( routes.array_of_routes[single_route]["status"] == "not_started" ) result+="blue";
    else if( routes.array_of_routes[single_route]["status"] == "generated" ) result+="blue";
    else if( routes.array_of_routes[single_route]["status"] == "solved" ) result+="green";
    else if( routes.array_of_routes[single_route]["status"] == "jumping" ) result+="green";
    else if( routes.array_of_routes[single_route]["status"] == "blocked" ) result+="red";
    result += "' onclick='show_details(this.id)' > "+single_route+" </button><br />";
   }

 document.getElementById("list_of_coordinates").innerHTML = result;
}



// ----------------------------------------------------------------------------------------------
// 	SHOW ROUTE DETAILS
// ----------------------------------------------------------------------------------------------
function show_details(id)
{
 // Extract destination name from the ID
 routes.active = id.substring(6);

 if( !routes.array_of_routes.hasOwnProperty(routes.active) )
 {
  routes.active = "";
  console.log(logtime() + "[ ERR! ] Destination to show details of is not in list of routes!");
  return;
 }

 result = "";
 result += "<table id='details_table'>";
 result += "<tr><td>Cíl: </td><td>"+ routes.array_of_routes[routes.active]["destination"] + "</td></tr>";
 result += "<tr><td>Status: </td><td>"+ routes.array_of_routes[routes.active]["status"] + "</td></tr>";
 result += "<tr><td title='Počet vteřin, jež bude trvat příprava kde skoku, správné nastavení a zážeh motorů. Po tuto dobu je ještě stále možné skok zrušit'>";
 result += "Čas (?):&nbsp;&nbsp;</td><td>"+ routes.array_of_routes[routes.active]["jump_time_sec"] + " sec</td></tr>";
 result += "</table><br />";
 if (routes.array_of_routes[routes.active]["status"] == "blocked")
   { result += "<button id='button_blocked' class='button_red' onclick='alert(\"VÝPOČET ZABLOKOVÁN\")'> ZABLOKOVÁNO </button>"; }
 else
   { result += "<button id='button_check_coordinates' class='button_blue' onclick='check_solved_sudoku(\""+routes.active+"\")'> Potvrdit výpočet </button>"; }
 result += "<button id='button_del_coordinates' class='button_blue' onclick='del_route_player(\""+routes.active+"\")'> Vymazat záznam </button>";
 result += "<br /><br />";
 if (routes.array_of_routes[routes.active]["status"] == "blocked")
   { result += "<div id='jump_fail' class='text_red_full jump_fail'> ! ZABLOKOVÁNO ! </div>"; }
 result += "<div id='jump_fail' class='text_red_full jump_fail'> KOORDINÁTY NEPOTVRZENY <br /><hr /> SKOK NENÍ PŘIPRAVEN </div>";
 result += "<div id='jump_pass' class='text_green_full jump_pass'> SKOK PŘIPRAVEN <br /><hr /> >>> SKOČIT <<< </div>";
 document.getElementById("list_of_details").innerHTML = result;

 // LOAD SUDOKU TO GRID
 if( routes.array_of_routes[routes.active]["status"] == "solved" )
   {
    prepare_board(routes.array_of_routes[routes.active]["sudoku_data_player_solution"])
    // Once solved, disable the button for submitting the coordinates
    document.getElementById("button_check_coordinates").classList.remove('button_blue');
    document.getElementById("button_check_coordinates").classList.add('button_grey');
    document.getElementById("button_check_coordinates").setAttribute("onclick", "null");
    // Once solved, change the INFO box
    document.getElementById("jump_pass").style.display = "inline-block";
    document.getElementById("jump_fail").style.display = "none";
   }
 else { prepare_board(routes.array_of_routes[routes.active]["sudoku_data"]) }

 if (routes.array_of_routes[routes.active]["status"] == "blocked")
   {
    prepare_board("                                                                                 ");
    document.getElementById("jump_pass").style.display = "none";
    document.getElementById("jump_fail").style.display = "none";
   }
}



// ----------------------------------------------------------------------------------------------
// 	PREPARE BOARD
// ----------------------------------------------------------------------------------------------
function empty_board()
{
 for(var row=1; row<=9; row++)
   {
    for(var col=1; col<=9; col++)
      {
       document.getElementById("cell_"+row+""+col).value = "";
       document.getElementById("cell_"+row+""+col).readOnly = false;
       document.getElementById("cell_"+row+""+col).style.backgroundColor = "";
      }
   }
}



function prepare_board(data)
{
 // Prepare board to its default, empty state
 empty_board();

 // Now we'll insert the incomming data into the matrix
 for(var row=1; row<=9; row++)
   {
    for(var col=1; col<=9; col++)
      {
       var value = data[ ((row-1)*9) + (col-1) ];
       // The "0" value represents an empty field
       if(value == "0") { document.getElementById("cell_"+row+""+col).value = ""; }
       else
         {
          document.getElementById("cell_"+row+""+col).value = value;
          document.getElementById("cell_"+row+""+col).readOnly = true;
         }
      }
   }

 // Finally, reset the box that indicates successfuly solved Sudoku to its default state (not solved)
 document.getElementById("jump_fail").style.display = "inline-block";
 document.getElementById("jump_pass").style.display = "none";
}



// ----------------------------------------------------------------------------------------------
// 	CHECK USER INPUT
// ----------------------------------------------------------------------------------------------
// Every time player insert a value, check that it is a valid value by the rules of the Sudoku puzzle
// If the value is wrong, color the filed in red
function check_user_input(id)
{
 // At the beginning reset the color of the field
 document.getElementById(id).style.backgroundColor = "";

 // Check that the inserted value is number between 1 and 9
 // If it is, just delete the value entirely
 var value = document.getElementById(id).value;
 if( value < "1" || value > "9") { document.getElementById(id).value = ""; return false; }

 // Every cell has a ID made of "cell_" + row + col. Extract the information.
 var row = id[5];
 var col = id[6];
 
 // Check that the value does not repeat in the row
 for(var check_row=1; check_row<=9; check_row++)
   {
    if( row == check_row ) continue;
    if( document.getElementById("cell_"+check_row+""+col).value == value)
      {
       document.getElementById(id).style.backgroundColor = "red";
       return false;
      }
   }

 // Check that the value does not repeat in the column
 for(var check_col=1; check_col<=9; check_col++)
   {
    if( col == check_col ) continue;
    if( document.getElementById("cell_"+row+""+check_col).value == value)
      {
       document.getElementById(id).style.backgroundColor = "red";
       return false;
      }
   }

 // Check that the value does not repeat in the 3x3 square
 // Find the ID of top left cell of the particular 3x3 square 
 var root_row = row - (row-1)%3;
 var root_col = col - (col-1)%3;

 for(var check_row=root_row; check_row<root_row+3; check_row++)
   {
    for(var check_col=root_col; check_col<root_col+3; check_col++)
      {
       if( check_row == row && check_col == col) continue;
       if( document.getElementById("cell_"+check_row+""+check_col).value == value)
         {
          document.getElementById(id).style.backgroundColor = "#f00";
          return false;
         }
      }
   }
 return true;
}



// ----------------------------------------------------------------------------------------------
// 	CHECK SOLVED SUDOKU
// ----------------------------------------------------------------------------------------------
function check_solved_sudoku(destination)
{
 // Iterate through all cells, fill up the "sudoku string.
 var sudoku = "";
 for(var row=1; row<=9; row++)
   {
    for(var col=1; col<=9; col++)
      {
       if( document.getElementById("cell_"+row+""+col).value == "" )
         {
          alert("ERROR: !! Nelze nechat žádná pole prázdná !!");
          return false;
         } 
       if( check_user_input("cell_"+row+""+col) == false )
         {
          alert("ERROR: !! V řešení jsou chyby !!");
          return false;
         }
       // Fill up the sudoku string 
       sudoku += document.getElementById("cell_"+row+""+col).value;
      }
   }

 // Now send the string to server to approve our solution
 console.log(logtime() + "[ INFO ] Sending request to CHECK SOLVED SUDOKU");
 socket.emit('sudoku_solved', { destination: destination, sudoku: sudoku });
}

