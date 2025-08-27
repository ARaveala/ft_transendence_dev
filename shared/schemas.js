/**
 * Schemas for request and response validation using TypeBox
 * Each schema defines the expected structure of data for various API operations
 * This helps ensure data integrity and provides clear error messages for invalid data.
 * 
 * Breaking down schemas.
 * - name and type.object state what the schema is and that it is an object
 * - description is optional but useful for documentation , its is for humans
 */

const { Type } = require('@sinclair/typebox');

const Schemas = {
// check is name in use

  RegisterUser: Type.Object({
    username: Type.String({ 
		minLength: 3, 
    	maxLength: 20,
    	pattern: '^[a-zA-Z0-9_]+$',
    	description: 'Must be 3–20 characters, no spaces, only letters, numbers, and underscores'
	}),
    password: Type.String({ minLength: 6 }),
    score: Type.Optional(Type.Number()),
    status: Type.Optional(Type.String()),
  }),

  GetUser: Type.Object({
    id: Type.Number(),
    username: Type.String({ minLength: 3 }),
    score: Type.Optional(Type.Number()),
    status: Type.Optional(Type.String()),
  }),

  // Add more schemas here as needed
};

module.exports = Schemas;

