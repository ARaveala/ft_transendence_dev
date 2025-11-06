exit_after_auth = false
pid_file = "/tmp/vault-agent.pid"

auto_auth {
    method "token_file" {
        config = {
            token_file_path = "/vault/config/devtoken"
        }
    }
    sink "file" {
        config = {
            path = "/run/secrets/vault_token"
        }
    }
}

template {
    source  = "/vault/templates/app.env.ctmpl"
    destination = "/run/secrets/app.env"
    command = "sh -c 'chmod 0400 /run/secrets/app.env'"
    perms = "0400"

    wait {
        min = "2s"
        max = "5s"
    }
}
