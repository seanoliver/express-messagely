'use strict';

const { BCRYPT_WORK_FACTOR } = require('../config');
const { UnauthorizedError, NotFoundError } = require('../expressError');
const bcrypt = require('bcrypt');
const db = require('../db');

/** User of the site. */

class User {
	/** Register new user. Returns
	 *    {username, password, first_name, last_name, phone}
	 */

	static async register({ username, password, first_name, last_name, phone }) {
		// console.log("BCRYPT_WORK_FACTOR", BCRYPT_WORK_FACTOR);
		const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
		const result = await db.query(
			`INSERT INTO users (username,
                          password,
                          first_name,
                          last_name,
                          phone,
                          join_at,
                          last_login_at)
         VALUES
           ($1, $2, $3, $4, $5, $6, $7)
         RETURNING username, password, first_name, last_name, phone`,
			[
				username,
				hashedPassword,
				first_name,
				last_name,
				phone,
				new Date(),
				new Date(),
			]
		);

		return result.rows[0];
	}

	/** Authenticate: is username/password valid? Returns boolean. */

	static async authenticate(username, password) {
		const result = await db.query(
			'SELECT password FROM users WHERE username = $1',
			[username]
		);
		const user = result.rows[0];

		if (user) {
			if ((await bcrypt.compare(password, user.password)) === true) {
				return true;
			}
		}
		console.log('username', username, 'password', password);
		return false;
	}

	/** Update last_login_at for user */

	static async updateLoginTimestamp(username) {
		const result = await db.query(
			`UPDATE users
        SET last_login_at = $1
        WHERE username = $2`,
			[new Date(), username]
		);

		console.log('updatelogintimestamp', result.rows[0]);
	}

	/** All: basic info on all users:
	 * [{username, first_name, last_name}, ...] */

	static async all() {
		const results = await db.query(
			`SELECT username,
              first_name,
              last_name
         FROM users`
		);

		return results.rows;
	}

	/** Get: get user by username
	 *
	 * returns {username,
	 *          first_name,
	 *          last_name,
	 *          phone,
	 *          join_at,
	 *          last_login_at } */

	static async get(username) {
		const results = await db.query(
			`SELECT username,
              first_name,
              last_name,
              phone,
              join_at,
              last_login_at
          FROM users
          WHERE username = $1`,
			[username]
		);

		const user = results.rows[0];

		if (!user) {
			throw new NotFoundError(`No such user ${username}`);
		}

		return user;
	}

	/** Return messages from this user.
	 *
	 * [{id, to_user, body, sent_at, read_at}]
	 *
	 * where to_user is
	 *   {username, first_name, last_name, phone}
	 */

	static async messagesFrom(username) {
		const results = await db.query(
			`SELECT m.id,
              m.to_username,
              u.first_name,
              u.last_name,
              u.phone,
              m.body,
              m.sent_at,
              m.read_at
         FROM messages AS m
         JOIN users AS u ON m.to_username = u.username
        WHERE from_username = $1`,
			[username]
		);

		return results.rows.map(result => {
			return {
				id: result.id,
				to_user: {
					username: result.to_username,
					first_name: result.first_name,
					last_name: result.last_name,
					phone: result.phone,
				},
				body: result.body,
				sent_at: result.sent_at,
				read_at: result.read_at,
			};
		});
	}

	/** Return messages to this user.
	 *
	 * [{id, from_user, body, sent_at, read_at}]
	 *
	 * where from_user is
	 *   {username, first_name, last_name, phone}
	 */

	static async messagesTo(username) {
    

  }
}

module.exports = User;
