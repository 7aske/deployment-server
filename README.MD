# Deployment server

##Api:
####hostname:port/browse:
Returns the list of servers with names or IDs based on searchString:

    {query:"query"}
        
####hostname:port/clear:
Clears the **errors** and **messages** fields for a given server/servers: 
        
    {query:"query"}
            
####hostname:port/deploy:
Deploys the app cloned from the repository URL sullied with the request.
Only public repositories thar are valid Node.js or plain HTML are supported.
Entry point must be specified in package.json file eg. {"main": "server.js"} or {"main": "index.js"}.
Ports are incrementally associated going up from the deployment servers port.
    
    {query:"repoLink"}
    
####hostname:port/browse:
Returns the servers from the .json file that represents the manifest of currently deployed servers.

    {query:"query"}
    
    
####hostname:port/find:
Same as "browse" only returns the list of currently active(running) servers based on query.

    {query:"query"}

####hostname:port/remove:
Removes the repository folder based on query and updates .json manifest file. Frees up the port on which the previous server was deployed. Supports multiple results.

    {query:"query"}
    
####hostname:port/run:
Runs the server based on query on its specified port. Supports multiple results.

    {query:"query"}

####hostname:port/update:
Terminates the child server and preforms ```git pull``` for the given repository. Does not run the server after completion.

    {query:"query"}
    
####hostname:port-1/
Terminates the server and preforms its update using ```git pull```. Runs the server on the initial port after successful update.

