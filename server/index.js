var http = require("http");
var fs = require("fs");
var path = require("path");
var bodyParser = require("body-parser");
// const MongoClient = require("mongodb").MongoClient
// var ObjectId = require("mongodb").ObjectID;
var request = require("request");
const querystring = require('querystring');
const express = require("express");
const app = express();
const router = express.Router();

const Config = require("./Config");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "/static")));
app.use(express.static(path.join(__dirname, "/../client")));
app.use(express.static(path.join(__dirname, "/../node_modules")));
app.use(express.static(path.join(__dirname, "/../resources")));

function get_folderlist(folder) {
	const is_dir = source => fs.lstatSync(source).isDirectory();
	const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(is_dir);
	let list = getDirectories(path.join(__dirname, "/static/data/", folder));
	return list.map(x => path.basename(x));
}

// -------------------------------------------------------------
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

function search_and_find_file(file0) {
	let file1 = path.join(__dirname, "/static/homearmen/", file0);
	let file2 = path.join(__dirname, "/static/root/", file0);
	let files = [file1, file2]
	for (let f in files) {
		if (fs.existsSync(files[f]))
			return files[f];
	}
	return null;
}

app.get("/download/csv/*", function (req, res) {
	let file = search_and_find_file(req.params["0"]);
	res.sendFile(file);
});

app.get("/download/vox/*", function (req, res) {
	let file = search_and_find_file(req.params["0"]);
	res.sendFile(file);
});

app.get("/download/mesh/scannet/:id", function (req, res) {
	let id = req.params.id;
	
	let filename = path.join(__dirname, "/static/root/mnt/braxis/ScanNet/internal/scans/checked/", id, id + "_vh_clean_2.ply");
	res.sendFile(filename);
});

app.get("/download/mesh/shapnet/:catid/:id", function (req, res) {
	let catid = req.params.catid;
	let id = req.params.id;

	let filename = path.join(__dirname, "/static/root/mnt/braxis/Datasets/ShapeNetCore.v2/", catid, id, models, "normalized.obj");
	res.sendFile(filename);
});

router.get("/", function (req, res) {
    res.redirect(path.join(Config.base_url, "/0"));
});

router.get("/scene/*", function (req, res) {
    res.render("SceneViewer", {
		id_file : req.params["0"]
	});
});

router.get("/vox/*", function (req, res) {
	console.log(req.params["0"])
    res.render("VoxViewer", {
		id_file : req.params["0"]
	});
});

app.use(Config.base_url, router);
module.exports = router;
// -------------------------------------------------------------

let async0 = new Promise((resolve, reject) => {
	resolve();
});


Promise.all([async0]).then( res => {
  const server = http.createServer(app).listen(Config.http_port, function() {
      const host = server.address().address;
          const port = server.address().port;
          console.log("Server listening at address http://%s in port: %s", host, port)
  });
});
