"use strict";

const { SECRET_KEY } = require("../config");
const db = require("../db");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const Router = require("express").Router;
const router = new Router();

/** POST /login: {username, password} => {token} */

router.post("/login", async function (req, res, next) {
  if (req.body === undefined) throw new BadRequestError();
  const { username, password } = req.body;

  if (await User.authenticate(username, password) === true) {

    const token = jwt.sign({ username }, SECRET_KEY);
    console.log("token", token);

    return res.json({ token });

  } else {
    throw new UnauthorizedError("Invalid username/password");
  }
});

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

router.post('/register', async function (req, res, next) {
  if (req.body === undefined) throw new BadRequestError();

  const result = await User.register(req.body);
  const token = jwt.sign({ username: result.username }, SECRET_KEY);

  return res.json({ token });

});

module.exports = router;
