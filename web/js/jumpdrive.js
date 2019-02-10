
// Define type of our client. This type is sent to the server as a part of "connect" message
var client_type = "user";
var destination = "";



function generate_new_sudoku()
{
 // First of all, ask player for the name of his desired destination
 while(1)
   {
    var result = prompt("Zadejte cílovou destinaci");
    if ( result == null ) return;
    if ( result == "" ) { alert("Je nutné zadat destinaci!!"); continue; }
    destination = result;
    console.log(logtime() + "[ DATA ] Destination: " + destination );
    break;
   }

 // Now we want to send request to the server for a new Sudoku
 console.log(logtime() + "[ INFO ] Sending request for NEW_SUDOKU");
 socket.emit('new_sudoku_request', { message: 'Request for a new sudoku', destination: destination });

 // While the Sudoku is being generated, spawn a box saying it is "in progress"
 var generating_progress = document.createElement("DIV");
 generating_progress.setAttribute("id", "generating_progress");
 generating_progress.setAttribute("class", "text_blue");
 var generating_progress_text = document.createTextNode("ZÍSKÁVÁM CÍLOVÉ KOORDINÁTY");
 generating_progress.appendChild(generating_progress_text);
 document.body.appendChild(generating_progress);
}



function prepare_board(data)
{
 console.log(logtime() + "[ INFO ] Recieved message NEW_SUDOKU");
 console.log(logtime() + "[ DATA ] Recieved data:"+data);

 // Prepare board to its default, empty state
 for(var row=1; row<=9; row++)
   {
    for(var col=1; col<=9; col++)
      {
       document.getElementById("cell_"+row+""+col).value = "";
       document.getElementById("cell_"+row+""+col).readOnly = false;
       document.getElementById("cell_"+row+""+col).style.backgroundColor = "";
      }
   }

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



// Every time player insert a value, check that it is a valid value by the rules of the Sudoku puzzle
// If the value is wrong, color the filed in red
function check_user_input(id)
{
 // At the beginning reset the color of the field
 document.getElementById(id).style.backgroundColor = "";

 // Check that the inserted value is number between 1 and 9
 // If it is, just delete the value entirely
 var value = document.getElementById(id).value;
 if( value < "0" || value > "9") { document.getElementById(id).value = ""; return false; }

 // Every cell has a ID made of "cell_" + row + col. Extract the information.
 var row = id[5];
 var col = id[6];
 
 // Check that the value does not repeat in the row
 for(var check_row=1; check_row<=9; check_row++)
   {
    if( row == check_row ) continue;
    if( document.getElementById("cell_"+check_row+""+col).value == value)
      {
       document.getElementById(id).style.backgroundColor = red;
       return false;
      }
   }

 // Check that the value does not repeat in the column
 for(var check_col=1; check_col<=9; check_col++)
   {
    if( col == check_col ) continue;
    if( document.getElementById("cell_"+row+""+check_col).value == value)
      {
       document.getElementById(id).style.backgroundColor = red;
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


// Check that the entire Sudoku has been solved
function check_solved_sudoku()
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
 socket.emit('sudoku_solved', { sudoku: sudoku });
}



// When new sudoku has been recieved - either we asked for it or someone else - overwrite the one we currently have
socket.on('new_sudoku', function(data)
{
 // Reset the board
 prepare_board(data);

 // Delete the "In progress" box, if we have it (we don't have it if we didn't asked for new sudoku, but someone else did)
 var generating_progress = document.getElementById("generating_progress");
 if (generating_progress != null) generating_progress.remove();

 // If disabled, enable the button for submitting the coordinates
 document.getElementById("button_check_coordinates").classList.remove('button_grey');
 document.getElementById("button_check_coordinates").classList.add('button_blue');
 //document.getElementById("button_check_coordinates").onclick = check_solved_sudoku();
 document.getElementById("button_check_coordinates").setAttribute("onclick", "check_solved_sudoku()");
});



// When the server approved someone's solution, print the solution and set state as "solved"
socket.on('sudoku_solved_confirmed', function(data)
{
 console.log(logtime() + "[ INFO ] Recieved message SUDOKU_SOLVED_CONFIRMED");
 console.log(logtime() + "[ DATA ] Recieved data (destination): "+data["destination"]);
 // Reset the board
 prepare_board(data["sudoku_data"]);
 // Set the status box to "solved" and add the destination
 document.getElementById("jump_fail").style.display = "none";
 document.getElementById("jump_pass").style.display = "inline-block";
 document.getElementById("destination").innerHTML = data["destination"];

 // Once solved, disable the button for submitting the coordinates
 document.getElementById("button_check_coordinates").classList.remove('button_blue');
 document.getElementById("button_check_coordinates").classList.add('button_grey');
 //document.getElementById("button_check_coordinates").onclick = null;
 document.getElementById("button_check_coordinates").setAttribute("onclick", "null");
});



// When the server disapproves our solution, notify the player
socket.on('sudoku_solved_denied', function(data)
{
 console.log(logtime() + "[ ERR! ] Recieved message SUDOKU_SOLVED_DENIED: " + data);
 alert("SERVER ERROR: " + data);
});



// Recieve and store client IP
socket.on('client_IP', function(data)
{
 console.log(logtime() + "[ DATA ] Recieved my IP: " + data);
 document.getElementById("client_identification").innerHTML = data;
});
