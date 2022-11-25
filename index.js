const express = require("express"),
  app = express(),
  home = require("./routes/default"),
  scrape = require("./routes/scrapper"),
  autoScrape = require("./routes/autoScraper"),
  list = require("./routes/list"),
  lists = require("./routes/lists"),
  sendMail = require("./routes/sendEmail"),
  // bodyParser = require("body-parser"),
  cors = require("cors");
morgan = require("morgan");
const multer = require("multer");

path = require("path");
var forms = multer();

// const active = require("./routes/active");

// app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.json());
app.use(forms.array());
app.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies
// app.use(express.static(path.join(__dirname, "public")));

// app.use(upload.array());
// app.use(express.static("public"));
app.use(cors());

app.use(morgan("tiny"));

app.set("currPort", 2);

app.use("/", home);
app.use("/list-emails", scrape);
app.use("/list-emails-automate", autoScrape);
app.use("/list", list);
app.use("/lists", lists);
app.use("/sendmail", sendMail);
app.use(function (req, res, next) {
  req.app = app;
  next();
});

app.get("/scraper", (req, res) => {
  res.sendFile(path.join(__dirname + "\\index.html"));
});

app.listen(80, () => {
  console.log(`App listening at port 80`);
});
exports = module.exports = app;
