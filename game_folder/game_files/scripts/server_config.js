const LOCAL = true;

var SERVER_URL = "https://" + window.location.hostname + ":4040";
if(!LOCAL)
{
  SERVER_URL = "localhost";
}