// ----------------------------------------------------------------------------------------------
//		CLASS DEFINITONS
// ----------------------------------------------------------------------------------------------
class route {

    constructor()
    {
     this.destination                    = " ";
     this.difficulty                     = "Easy";
     this.sudoku_data                    = " ";
     this.sudoku_data_generated_solution = " ";
     this.sudoku_data_player_solution    = " ";
     this.status                         = "not_started";
     this.jump                           = " ";
     this.jump_time_sec                  = 60;
    }

    set_destination(destination) {this.destination = destination;}
    set_difficulty(difficulty) {this.difficulty = difficulty;}
    set_sudoku_data(sudoku_data) {this.sudoku_data = sudoku_data;}
    set_sudoku_data_generated_solution(sudoku_data_generated_solution) {this.sudoku_data_generated_solution = sudoku_data_generated_solution;}
    set_sudoku_data_player_solution(sudoku_data_player_solution) {this.sudoku_data_player_solution = sudoku_data_player_solution;}
    set_status(status) {this.status = status;}
    set_jump(jump) {this.jump = jump;}
    set_jump_time_sec(jump_time_sec) {this.jump_time_sec = jump_time_sec;}
};



class list_of_routes {

    constructor()
    {
     this.max_routes        = 0;
     this.array_of_routes   = {};
     this.active            = "";
     this.global_difficulty = "";

    }

  load_data(data)
    {
     delete this.array_of_routes;
     this.array_of_routes = {};

     this.max_routes = data["max_routes"];
     this.global_difficulty = data["global_difficulty"];

     for (var single_route in data["routes_list"])
       {
        this.array_of_routes[single_route] = new route();
        for (var key in data["routes_list"][single_route])
          {
           this.array_of_routes[single_route][key] = data["routes_list"][single_route][key];
          }
       }
    }

};



// ----------------------------------------------------------------------------------------------
// 	Create one instance of the master route data stucture
// ----------------------------------------------------------------------------------------------
var routes = new list_of_routes();



// ----------------------------------------------------------------------------------------------
// 	GET DESTINATION
// ----------------------------------------------------------------------------------------------
function get_destination()
{
 var destination;
 // Ask player for the name of his desired destination
 while(1)
   {
    destination = prompt("Zadejte cílovou destinaci");
    if ( destination == null ) return false;
    if ( destination == "" ) { alert("Je nutné zadat destinaci!!"); continue; }

    if( routes.array_of_routes.hasOwnProperty(destination) )
    {
     console.log(logtime() + "[ ERR! ] Can't change destination to one which already is in the list of destinations!");
     alert("Nelze mít 2 destinace se stejným názvem"); continue
    } 

    console.log(logtime() + "[ DATA ] Destination: " + destination );
    break;
   }
 return destination;
}



// ----------------------------------------------------------------------------------------------
// 	ADD ROUTE
// ----------------------------------------------------------------------------------------------
function add_route(destination)
{
 if( destination == "" ) { console.log(logtime() + "[ ERR! ] Cannot create destination with an empty name!"); return false; }
 console.log(logtime() + "[ INFO ] Sending request for ADD_ROUTE");
 socket.emit('add_route', destination);
}



// ----------------------------------------------------------------------------------------------
// 	DEL ROUTE
// ----------------------------------------------------------------------------------------------
function del_route(destination)
{
 console.log(logtime() + "[ INFO ] Sending request for DEL_ROUTE");
 socket.emit('del_route', destination);
}

