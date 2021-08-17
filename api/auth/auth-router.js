const router = require("express").Router();
const {
  checkUsernameFree,
  checkUsernameExists,
  checkPasswordLength
} = require("./auth-middleware");
const users = require("../users/users-model");
const bcrypt = require("bcryptjs");

router.post("/register", checkPasswordLength, checkUsernameFree, (req,res,next)=>{
  const {username, password} = req.body;

  let hash = bcrypt.hashSync(password, 8);
  let newUser = {
    username,
    password: hash
  }
  users.add(newUser)
  .then(newUser => {
    res.status(201).json(newUser);
  })
  .catch(next);
})
/**
  1 [POST] /api/auth/register { "username": "sue", "password": "1234" }
  response:
  status 200
  {
    "user_id": 2,
    "username": "sue"
  }
  response on username taken:
  status 422
  {
    "message": "Username taken"
  }
  response on password three chars or less:
  status 422
  {
    "message": "Password must be longer than 3 chars"
  }
 */

router.post("/login",checkUsernameExists, async (req,res,next)=>{
  try{
    const {username, password} = req.body;
    const [user] = await users.findBy({ username })
    if(user && bcrypt.compareSync(password, user.password)){
      req.session.user = user;
      res.status(200).json({
        message:`Welcome ${user.username}`
      })
    }else{
      next({
        status:401,
        message:"Invalid credentials"
      })
    }
  } catch (err) {
    next(err);
  }
})

/**
  2 [POST] /api/auth/login { "username": "sue", "password": "1234" }
  response:
  status 200
  {
    "message": "Welcome sue!"
  }
  response on invalid credentials:
  status 401
  {
    "message": "Invalid credentials"
  }
 */

router.get("/logout", (req,res,next)=>{
  if(req.session.user){
    req.session.destroy(err => {
        res.json({
          message: "logged out"
        })
    })
  }else{
    res.json({
      message: "no session"
    })
  }
})

/**
  3 [GET] /api/auth/logout
  response for logged-in users:
  status 200
  {
    "message": "logged out"
  }
  response for not-logged-in users:
  status 200
  {
    "message": "no session"
  }
 */

 
module.exports = router;
