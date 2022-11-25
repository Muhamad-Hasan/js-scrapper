var multer = require('multer');
var fs = require('fs');
const upload = multer({ dest: 'upload'});
// var type = upload.single('recfile');

// app.post('/upload', type, function (req,res) {

//     /** When using the "single"
//         data come in "req.file" regardless of the attribute "name". **/
//     var tmp_path = req.file.path;
  
//     /** The original name of the uploaded file
//         stored in the variable "originalname". **/
//     var target_path = 'uploads/' + req.file.originalname;
  
//     /** A better way to copy the uploaded file. **/
//     var src = fs.createReadStream(tmp_path);
//     var dest = fs.createWriteStream(target_path);
//     src.pipe(dest);
//     src.on('end', function() { res.render('complete'); });
//     src.on('error', function(err) { res.render('error'); });
  
//   });
 
module.exports =  upload;