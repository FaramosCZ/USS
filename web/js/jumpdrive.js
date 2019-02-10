
// Define type of our client. This type is sent to the server as a part of "connect" message
var client_type = "user";
var destination = "";

function generate_new_sudoku()
  {

   while(1)
   {
    var result = prompt("Zadejte cílovou destinaci");
    if ( result == null ) return;
    if ( result == "" )
      {
       alert("Je nutné zadat destinaci!!");
       continue;
      }
    destination = result;
    console.log("Destination: "+destination);
    break;
   }

   console.log("Sending request for NEW_SUDOKU");
   socket.emit('new_sudoku_request', { message: 'Request for a new sudoku', destination: destination });
  }

function prepare_board(data)
{
 console.log("Recieved message NEW_SUDOKU");
 console.log("Recieved data:"+data);

 // Prepare board
 for(var row=1; row<=9; row++)
   {
    for(var col=1; col<=9; col++)
      {
       document.getElementById("cell_"+row+""+col).value = "";
       document.getElementById("cell_"+row+""+col).readOnly = false;
       document.getElementById("cell_"+row+""+col).style.backgroundColor = "";
      }
   }


 // Now we'll insert the data into the matrix
 for(var row=1; row<=9; row++)
   {
    for(var col=1; col<=9; col++)
      {
       var value = data[ ((row-1)*9) + (col-1) ];
       if(value == "0") 
         {
          document.getElementById("cell_"+row+""+col).value = "";
         }
       else
         {
          document.getElementById("cell_"+row+""+col).value = value;
          document.getElementById("cell_"+row+""+col).readOnly = true;
         }
      }
   }

   document.getElementById("jump_fail").style.display = "inline-block";
   document.getElementById("jump_pass").style.display = "none";

}

socket.on('new_sudoku', function(data)
{
 console.log("Recieved message NEW_SUDOKU");
 console.log("Recieved data:"+data);
 prepare_board(data);
});



function check_user_input(id)
{
 document.getElementById(id).style.backgroundColor = "";

 var value = document.getElementById(id).value;
 if( value < "0" || value > "9")
   {
    document.getElementById(id).value = "";
    return;
   }

 var row = id[5];
 var col = id[6];
 

 // Check row
 for(var check_row=1; check_row<=9; check_row++)
   {
    if( row == check_row ) continue;
    if( document.getElementById("cell_"+check_row+""+col).value == value)
      {
       document.getElementById(id).style.backgroundColor = "#f00";
       return false;
      }
   }

 // Check col
 for(var check_col=1; check_col<=9; check_col++)
   {
    if( col == check_col ) continue;
    if( document.getElementById("cell_"+row+""+check_col).value == value)
      {
       document.getElementById(id).style.backgroundColor = "#f00";
       return false;
      }
   }

 // Check square
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


function check_solved_sudoku()
{
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
       // sudoku string 
       sudoku += document.getElementById("cell_"+row+""+col).value;
      }
   }

 console.log("Sending request to CHECK SOLVED SUDOKU");
 socket.emit('sudoku_solved', { sudoku: sudoku });
}



socket.on('sudoku_solved_confirmed', function(data)
{
 console.log("Recieved message SUDOKU_SOLVED_CONFIRMED");
 console.log("Recieved data (destination): "+data["destination"]);
 prepare_board(data["sudoku_data"]);
 document.getElementById("jump_fail").style.display = "none";
 document.getElementById("jump_pass").style.display = "inline-block";
 document.getElementById("destination").innerHTML = data["destination"];
});


socket.on('sudoku_solved_denied', function(data)
{
 console.log("Recieved message SUDOKU_SOLVED_DENIED: " + data);
 alert("SERVER ERROR: " + data)
});

