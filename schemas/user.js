const { Type } = require('@sinclair/typebox');

const RegisterUserSchema = Type.Object({
  username: Type.String({ minLength: 3 }),
  password: Type.String({ minLength: 6 }),
  score: Type.Optional(Type.Number()),
  status: Type.Optional(Type.String()),
});

module.exports = {
  RegisterUserSchema
};
