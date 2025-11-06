const tournamentSchema = {
    body: {
        type: 'object',
        required: ['password', 'username', 'alias'],
        properties: {
            password: {
                type: 'string',
                pattern: '^[a-zA-Z0-9!@#$%^&*()_\\-+=.]{8,16}$',
                minLength: 8,
                maxLength: 16
            },
            alias: {
                type: 'string',
                pattern: '^[a-zA-Z0-9_]{5,10}$',
                minLength: 5,
                maxLength: 10
            },
            username: { 
                type: 'string', 
                pattern: '^[a-zA-Z][a-zA-Z0-9_]{5,11}$',
                minLength: 6,
                maxLength: 12
            }
        }
    }
}
