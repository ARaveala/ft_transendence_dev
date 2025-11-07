const passwordSchema = {
    body: {
        type: 'object',
        required: ['current_password', 'new_password'],
        properties: {
            current_password: {
                type: 'string',
                pattern: '^[a-zA-Z0-9!@#$%^&*()_\\-+=.]{8,16}$',
                minLength: 8,
                maxLength: 16
            },
            new_password: {
                type: 'string',
                pattern: '^[a-zA-Z0-9!@#$%^&*()_\\-+=.]{8,16}$',
                minLength: 8,
                maxLength: 16
            }
        }
    }
};

module.exports = passwordSchema;
