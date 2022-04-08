const express = require('express')
const bcrypt = require('bcrypt')
const session = require('express-session')
const flash = require('express-flash')

const app = express()
const port = 5000
const db = require('./connection/db')
const upload = require('./middlewares/fileUpload')

app.set('view engine', 'hbs')   // set view engine hbs
app.use('/public', express.static(__dirname + '/public'))    // set public path/folder
app.use('/uploads', express.static(__dirname + '/uploads'))    // set public path/folder
app.use(express.urlencoded({ extended: false }))    // encode / conver
app.use(flash())
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 2 * 60 * 60 * 1000  // 2 jam
    }
}))

// APP GET
// GET INDEX edit
app.get('/', function (req, res) {
    console.log(req.session);

    if (req.session.isLogin) {
        let userId = req.session.user.id
        const query = `SELECT tb_projects.id, tb_projects.author_id, tb_users.name, tb_users email, tb_projects.title, tb_projects.start_date, tb_projects.end_date, tb_projects.description, tb_projects.technologies, tb_projects.image
        FROM tb_projects LEFT JOIN tb_users ON tb_projects.author_id = tb_users.id WHERE author_id=${userId}`

        db.connect(function (err, client, done) {
            if (err) throw err

            client.query(query, function (err, result) {
                if (err) throw err
                // console.log(result.rows);
                let data = result.rows

                data = data.map(function (item) {
                    return {
                        ...item,
                        title: item.title,
                        start_date: convertFullTime(item.start_date),
                        duration: durationProject(item.start_date, item.end_date),
                        description: item.description.slice(0, 150) + '...',
                        reactjs: checkboxes(item.technologies[0]),
                        nodejs: checkboxes(item.technologies[1]),
                        javascript: checkboxes(item.technologies[2]),
                        java: checkboxes(item.technologies[3]),
                        image: item.image
                    }
                })
                res.render('index', { isLogin: req.session.isLogin, user: req.session.user, cardProject: data })
            })
        })
    } else {
        const query = `SELECT tb_projects.id, tb_projects.author_id, tb_users.name, tb_users email, tb_projects.title, tb_projects.start_date, tb_projects.end_date, tb_projects.description, tb_projects.technologies, tb_projects.image
        FROM tb_projects LEFT JOIN tb_users ON tb_projects.author_id = tb_users.id;`

        db.connect(function (err, client, done) {
            if (err) throw err

            client.query(query, function (err, result) {
                if (err) throw err
                // console.log(result.rows);
                let data = result.rows

                data = data.map(function (item) {
                    return {
                        ...item,
                        title: item.title,
                        start_date: convertFullTime(item.start_date),
                        duration: durationProject(item.start_date, item.end_date),
                        description: item.description.slice(0, 150) + '...',
                        reactjs: checkboxes(item.technologies[0]),
                        nodejs: checkboxes(item.technologies[1]),
                        javascript: checkboxes(item.technologies[2]),
                        java: checkboxes(item.technologies[3]),
                        image: item.image
                    }
                })
                res.render("index", { isLogin: req.session.isLogin, user: req.session.user, cardProject: data })
                // console.log(data)
                // console.log(userId)
            })
        })
    }
})

// GET ADD-PROJECT edit
app.get('/add-project', function (req, res) {
    if (!req.session.isLogin) {
        req.flash('danger', 'Silahkan Login terlebih dahulu!')
        return res.redirect('/login')
    }

    res.render('add-project', { isLogin: req.session.isLogin, user: req.session.user })
})

// GET REGISTER edit
app.get('/register', function (req, res) {
    res.render('register')
})

// GET LOGIN edit
app.get('/login', function (req, res) {
    res.render('login', { isLogin: req.session.isLogin, user: req.session.user })
})

// GET CONTACT edit
app.get('/contact-me', function (req, res) {
    if (!req.session.isLogin) {
        req.flash('danger', 'Silahkan Login terlebih dahulu!')
        return res.redirect('/login')
    }
    res.render('contact', { isLogin: req.session.isLogin, user: req.session.user })
})

// GET PROJECT DETAIL edit
app.get('/project-detail/:id', function (req, res) {
    let id = req.params.id

    db.connect(function (err, client, done) {
        if (err) throw err

        client.query(`SELECT * FROM tb_projects WHERE id = ${id}`, function (err, result) {
            if (err) throw err
            done()

            let data = result.rows[0]
            // console.log(result.rows[0]);

            data = {
                title: data.title,
                start_date: convertFullTime(data.start_date),
                end_date: convertFullTime(data.end_date),
                duration: durationProject(data.start_date, data.end_date),
                description: data.description,
                reactjs: checkboxes(data.technologies[0]),
                nodejs: checkboxes(data.technologies[1]),
                javascript: checkboxes(data.technologies[2]),
                java: checkboxes(data.technologies[3]),
                image: data.image
            }
            res.render('project-detail', { detail: data, isLogin: req.session.isLogin, user: req.session.user })
        })
    })
})

// GET EDIT PROJECT edit
app.get('/edit-project/:id', function (req, res) {
    if (!req.session.isLogin) {
        req.flash('danger', 'Silahkan Login terlebih dahulu!')
        return res.redirect('/login')
    }

    let id = req.params.id

    db.connect(function (err, client, done) {
        if (err) throw err

        let query = `SELECT * FROM tb_projects WHERE id = ${id}`
        client.query(query, function (err, result) {
            if (err) throw err
            done()

            let data = result.rows[0];
            // console.log(result.rows[0]);
            data = {
                title: data.title,
                start_date: getFullTime(data.start_date),
                end_date: getFullTime(data.end_date),
                description: data.description,
                reactjs: checkboxes(data.technologies[0]),
                nodejs: checkboxes(data.technologies[1]),
                javascript: checkboxes(data.technologies[2]),
                java: checkboxes(data.technologies[3]),
                image: data.image
            }
            res.render('edit-project', { isLogin: req.session.isLogin, user: req.session.user, edit: data, id })
        })
    })
})

// GET DELETE-PROJECT edit
app.get('/delete-project/:id', function (req, res) {
    if (!req.session.isLogin) {
        req.flash('danger', 'Silahkan Login terlebih dahulu!')
        return res.redirect('/login')
    }

    const id = req.params.id
    const query = `DELETE FROM tb_projects WHERE id=${id};`
    console.log(query);

    db.connect(function (err, client, done) {
        if (err) throw err

        client.query(query, function (err, result) {
            if (err) throw err
            done()

            res.redirect('/')
        })
    })
})

// GET LOGOUT edit
app.get('/logout', function (req, res) {
    req.session.destroy()

    res.redirect('/')
})

// APP POST
// POST REGISTER edit
app.post('/register', function (req, res) {
    let { inputName, inputEmail, inputPassword } = req.body
    console.log(req.body);
    const hashedPassword = bcrypt.hashSync(inputPassword, 10)
    // console.log('data asli:', inputPassword);
    // console.log('data encrypt:', hashedPassword);

    const querySelect = `SELECT * FROM tb_users WHERE email='${inputEmail}';`
    const queryInsert = `INSERT INTO tb_users(name, email, password) VALUES ('${inputName}', '${inputEmail}', '${hashedPassword}');`
    db.connect(function (err, client, done) {
        if (err) throw err

        client.query(querySelect, function (err, result) {
            if (err) throw err
            done()
            // console.log('ini result:', result);
            // console.log('ini result.rows.length:', result.rows.length);

            if (result.rows.length != 0) {
                console.log('Email sudah terdaftar. Silahkan menggunakan email lain!');
                req.flash('danger', 'Email sudah terdaftar. Silahkan menggunakan email lain!')
                return res.redirect('/register')
            } else {
                client.query(queryInsert, function (err, result) {

                    req.flash('success', 'Register Success! Silahkan melakukan Login.')
                    return res.redirect('/login')
                })
            }
        })
    })
})

// POST LOGIN edit
app.post('/login', function (req, res) {
    const { inputEmail, inputPassword } = req.body

    const query = `SELECT * FROM tb_users WHERE email='${inputEmail}';`
    db.connect(function (err, client, done) {
        if (err) throw err

        client.query(query, function (err, result) {
            if (err) throw err
            done()
            // console.log(result);

            if (result.rows.length == 0) {
                console.log('Email belum terdaftar');
                req.flash('danger', 'Email belum terdaftar')

                return res.redirect('/login')
            }

            const isMatch = bcrypt.compareSync(inputPassword, result.rows[0].password)
            // console.log(isMatch);

            if (isMatch) {
                // console.log('Login berhasil');

                // memasukkan data kedalam session
                req.session.isLogin = true
                req.session.user = {
                    id: result.rows[0].id,
                    name: result.rows[0].name,
                    email: result.rows[0].email
                }
                req.flash('success', 'Login Success')
                res.redirect('/')

            } else {
                // console.log('Password salah');
                req.flash('danger', 'Password Salah')
                res.redirect('/login')
            }
        })
    })
})

// POST ADD-PROJECT edit
app.post('/add-project', upload.single('inputImage'), function (req, res) {
    let data = req.body
    console.log('ini data:', data);
    const authorId = req.session.user.id
    const image = req.file.filename

    let query = `INSERT INTO tb_projects(title, start_date, end_date, description, technologies, image, author_id) VALUES ('${data.inputProjectName}','${data.startDate}','${data.endDate}', '${data.inputDescription}', '{${data.reactjs}, ${data.nodejs}, ${data.javascript}, ${data.java}}','${image}','${authorId}');`
    db.connect(function (err, client, done) {
        if (err) throw err

        client.query(query, function (err, result) {
            if (err) throw err
            done()
            console.log('ini hasil query insert:', result);
            res.redirect('/')
        })
    })
})

// POST UPDATE-PROJECT edit
app.post('/update-project/:id', function (req, res) {
    // console.log('ini data.req.body dari app.post(/update-project/:id');
    let data = req.body
    console.log(data);
    let id = req.params.id
    const authorId = req.session.user.id
    const image = req.file.filename

    data = {
        title: data.inputProjectName,
        start_date: data.start_date,
        end_date: data.end_date,
        description: data.inputDescription,
        reactjs: checkboxes(data.reactjs),
        nodejs: checkboxes(data.nodejs),
        javascript: checkboxes(data.javascript),
        java: checkboxes(data.java),
        image: data.image
    }

    console.log('ini data:', data);
    let query = `UPDATE tb_projects SET
    name = '${data.title}', start_date = '${data.start_date}', end_date ='${data.end_date}', description ='${data.description}', technologies = '{${data.reactjs}, ${data.nodejs}, ${data.javascript}, ${data.java}}', image='${image}', author_id='${authorId}'
    WHERE id = ${id}`
    db.connect(function (err, client, done) {
        if (err) throw err

        client.query(query, function (err, result) {
            if (err) throw err
            done()
            res.redirect('/')
        })
    })
})


// FUNCTION
// DURATION
function durationProject(startDate, endDate) {
    let start = new Date(startDate)
    let end = new Date(endDate)

    let duration = end.getTime() - start.getTime()

    let miliseconds = 1000 // 1000 miliseconds dalam 1 detik
    let secondInHours = 3600 // 1 jam sama dengan 3600 detik
    let hoursInDay = 24 // 24 jam dalam 1 hari

    let distanceDay = Math.floor(duration / (miliseconds * secondInHours * hoursInDay))
    let distanceWeek = Math.floor(distanceDay / 7)
    let distanceMonth = Math.floor(distanceDay / 30)

    if (distanceMonth > 0) {
        return `${distanceMonth} bulan`
    } else if (distanceWeek > 0) {
        return `${distanceWeek} minggu`
    } else if (distanceDay > 0) {
        return `${distanceDay} hari`
    }
}

// FULL TIME
function getFullTime(waktu) {
    let month = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'December']

    let date = waktu.getDate().toString().padStart(2, "0")
    // console.log(date);

    let monthIndex = (waktu.getMonth() + 1).toString().padStart(2, "0")
    // console.log(month[monthIndex]);

    let year = waktu.getFullYear()
    // console.log(year);

    let hours = waktu.getHours()
    let minutes = waktu.getMinutes()

    let dateTime = `${year}-${monthIndex}-${date}`
    // let fullTime = `${date} ${month[monthIndex]} ${year} ${hours}:${minutes} WIB`

    return dateTime
}

function convertFullTime(waktu) {
    let month = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'December']

    let date = waktu.getDate().toString().padStart(2, "0")
    // console.log(date);

    let monthIndex = waktu.getMonth()
    // console.log(month[monthIndex]);

    let year = waktu.getFullYear()
    // console.log(year);

    let hours = waktu.getHours()
    let minutes = waktu.getMinutes()

    let fullTime = `${date} ${month[monthIndex]} ${year}`

    return fullTime
}

// CHECKBOXES
function checkboxes(condition) {
    if (condition === 'on' || condition === 'true') {
        return true
    } else {
        return false
    }
}


// APP LISTEN
app.listen(port, function (req, res) {
    console.log(`server listen on port ${port}`);
}) 