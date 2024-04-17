const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const app = express();
const port = 3000;
const methodOverride = require('method-override');
const path = require('path');

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/foods');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

const db = new sqlite3.Database('./Project3.db', err => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the SQLite database.');
});

app.get('/', (req, res) => {
  const sql = `SELECT * FROM foods`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    res.render('add_food', { foods: rows });
  });
});

app.post('/add_food', upload.single('image'), (req, res) => {
  const { name, price } = req.body;
  const image = req.file.filename;

  const sql = `INSERT INTO foods (image, name, price) VALUES (?, ?, ?)`;
  db.run(sql, [image, name, price], function (err) {
    if (err) {
      return console.error(err.message);
    }
    res.redirect('/');
  });
});

app.use(methodOverride('_method'));

app.delete('/foods/:id', (req, res) => {
  const id = req.params.id;
  const sqlSelectImage = `SELECT image FROM foods WHERE id = ?`;
  db.get(sqlSelectImage, id, (err, row) => {
    if (err) {
      return console.error(err.message);
    }

    const sqlDeleteFood = `DELETE FROM foods WHERE id = ?`;
    db.run(sqlDeleteFood, id, function (err) {
      if (err) {
        return console.error(err.message);
      }

      const imagePath = `./public/images/foods/${row.image}`;
      fs.unlink(imagePath, (err) => {
        if (err) {
          return console.error(err.message);
        }
        res.redirect('/');
      });
    });
  });
});

app.get('/update_food/:id', (req, res) => {
  const id = req.params.id;
  const sql = `SELECT * FROM foods WHERE id = ?`;
  db.get(sql, [id], (err, row) => {
    if (err) {
      return console.error(err.message);
    }
    res.render('update_food', { food: row });
  });
});

app.post('/update_food/:id', upload.single('image'), (req, res) => {
  const id = req.params.id;
  const { name, price } = req.body;
  let image = req.file ? req.file.filename : req.body.current_image;
  const sqlSelectImage = `SELECT image FROM foods WHERE id = ?`;

  db.get(sqlSelectImage, [id], (err, row) => {
    if (err) {
      return console.error(err.message);
    }

    const oldImage = row.image;

    const sqlUpdateFood = `UPDATE foods SET image = ?, name = ?, price = ? WHERE id = ?`;
    db.run(sqlUpdateFood, [image, name, price, id], function (err) {
      if (err) {
        return console.error(err.message);
      }

      if (req.file && oldImage) {
        const oldImagePath = `./public/images/foods/${oldImage}`;
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            return console.error(err.message);
          }
        });
      }

      res.redirect('/');
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
