var express = require("express");
var app     = express();
var path    = require("path");

app.use(express.static('dist'))


app.get('/index',function(req,res){
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(3000);

console.log("Running at Port 3000");