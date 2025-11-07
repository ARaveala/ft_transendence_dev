const aliasSchema = {
    body: {
        type: 'object',
        required: ['alias'],
        properties: {
            alias: {
                type: 'string',
                pattern: '^[a-zA-Z0-9_]{5,10}$',
                minLength: 5,
                maxLength: 10
            }
        }
    }
};

module.exports = aliasSchema;
